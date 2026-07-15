import { Pool, QueryResultRow } from "pg";

// a SQL query is a string, and the values subbed into the string
export type SqlQuery = { text: string; values: unknown[] };

type ParameterizedAssignmentResult = {
    assignments: string[]; // ["title = $(1)", "description = $(2)"]
    values: unknown[]; // ["CS 453", "Client/Server Architectures"]
    nextPlaceholderIndex: number;
};

export class DatabaseService {
    constructor(protected readonly pool: Pool) {}

    public buildInsertQuery(
        tableName: string,
        payload: Record<string, unknown>,
        fields: string[],
        returningClause: string,
    ): SqlQuery {
        // we dont use buildParameterizedAssignments here because INSERT needs ...
        // ... separate column and value lists, not "column = $n" assignments
        const columnList = fields.join(", ");
        const placeholders = fields.map((_fieldName, i) => `$${i + 1}`).join(", ");
        const values = fields.map((fieldName) => payload[fieldName]);
        const text = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) RETURNING ${returningClause}`;

        return { text, values };
    }

    // see buildReplaceQuery
    public buildUpdateQuery(
        tableName: string,
        id: number,
        payload: Record<string, unknown>,
        fields: string[],
        returningClause: string,
    ): SqlQuery {
        const assignmentParts = this.buildParameterizedAssignments(payload, fields);
        const assignments = assignmentParts.assignments.join(", ");
        const values = assignmentParts.values;
        const idPlaceholder = `$${assignmentParts.nextPlaceholderIndex}`;
        const text = `UPDATE ${tableName} SET ${assignments} WHERE id = ${idPlaceholder} RETURNING ${returningClause}`;

        values.push(id);

        return { text, values };
    }

    public buildReplaceQuery(
        tableName: string,
        id: number,
        payload: Record<string, unknown>,
        providedFields: string[],
        allWritableFields: string[],
        returningClause: string,
    ): SqlQuery {
        // use a set because none of the fields are repeated and we dont care about the order
        const providedFieldSet = new Set(providedFields);
        // if its in the set, it is a writable field
        const fieldsToParameterize = allWritableFields.filter((fieldName) => providedFieldSet.has(fieldName));
        // make the title = $(1), description = $(2), status = $(3) etc
        const assignmentParts = this.buildParameterizedAssignments(payload, fieldsToParameterize);
        // map those parameters to their fields
        const parameterizedAssignments = new Map(assignmentParts.assignments.map((assignment, i) => [fieldsToParameterize[i], assignment]));

        // construct a string from that map, one that works for the SQL query
        const assignments = allWritableFields
            .map((fieldName) => parameterizedAssignments.get(fieldName) ?? `${fieldName} = DEFAULT`)
            .join(", ");

        const values = assignmentParts.values;
        const idPlaceholder = `$${assignmentParts.nextPlaceholderIndex}`;
        values.push(id);
        const text = `UPDATE ${tableName} SET ${assignments} WHERE id = ${idPlaceholder} RETURNING ${returningClause}`;

        return { text, values };
    }

    // the row returned from the db has some shape
    // a task would have the shape of a task record
    // so we call that shape T
    // and that's what's returned.
    public async executeSingleRowQuery<T extends QueryResultRow>(query: SqlQuery): Promise<T | null> {
        const result = await this.pool.query<T>(query.text, query.values);

        return result.rows[0] ?? null;
    }

    // this is what constructs the $(1), $(2) etc. in each query
    // depends on how many fields were received, and the order
    private buildParameterizedAssignments(
        payload: Record<string, unknown>,
        fields: string[],
        startPlaceholderIndex = 1,
    ): ParameterizedAssignmentResult {
        const assignments: string[] = [];
        const values: unknown[] = [];

        for (const [i, fieldName] of fields.entries()) {
            const placeholder = `$${startPlaceholderIndex + i}`;
            assignments.push(`${fieldName} = ${placeholder}`);
            values.push(payload[fieldName]);
        }

        return {
            assignments,
            values,
            nextPlaceholderIndex: startPlaceholderIndex + fields.length,
        };
    }
}
