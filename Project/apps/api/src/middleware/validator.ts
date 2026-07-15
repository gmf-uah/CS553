// this is mostly copy-pasted from the validator.js I wrote in Lab 5
import { Request, Response, NextFunction } from "express";
import { TaskValidationMode } from "../services/taskService";

// 
export interface FieldSchemaRule {
    dataType: string;
    requiredForCreateMinimum: boolean;
}

// which schema?
// TASK_SCHEMA, and potentially for the future USER_SCHEMA, etc.
// SchemaDefinition consists of many key/value pairs where the key is a string, and the value is ...
// an object that fits the brief FieldSchemaRule interface
export type SchemaDefinition = Record<string, FieldSchemaRule>;

function collectValidCreateFields(body: Record<string, unknown>, schema: SchemaDefinition) {
    let allFieldsAreValid = true;
    let validFields: string[] = [];

    for (const [fieldName, fieldRules] of Object.entries(schema)) {
        const incomingValue = body[fieldName];
        const incomingDataType = typeof incomingValue;
        const fieldExists = incomingDataType !== "undefined";

        if (fieldRules.requiredForCreateMinimum && !fieldExists) {
            // This field is required for the schema
            // But it doesn't exist
            // So, reject it
            allFieldsAreValid = false;
            break;
        }

        if (fieldExists && incomingDataType !== fieldRules.dataType) {
            // This field is NOT required
            // It does exist in the request body, though
            // However, the type doesn't match
            // Thus, reject it.
            allFieldsAreValid = false;
            break;
        }

        if (fieldExists && incomingDataType === fieldRules.dataType) {
            // The field exists, and the type matches, so consider it valid for the SQL request
            validFields.push(fieldName);
        }
    }

    if (!allFieldsAreValid) {
        // Return nothing, as no valid fields were collected
        return null;
    }

    return validFields;
}

function collectValidPartialFields(body: Record<string, unknown>, schema: SchemaDefinition) {
    let thereExistsAtLeastOneValidField = false;
    let thereExistsAtLeastOneInvalidField = false;
    let validFields: string[] = [];

    for (const [fieldName, fieldRules] of Object.entries(schema)) {
        const incomingDataType = typeof body[fieldName];
        if (incomingDataType !== "undefined") {
            if (incomingDataType === fieldRules.dataType) {
                thereExistsAtLeastOneValidField = true;
                validFields.push(fieldName);
            } else {
                thereExistsAtLeastOneInvalidField = true;
                break;
            }
        }
    }

    if (thereExistsAtLeastOneInvalidField || !thereExistsAtLeastOneValidField) {
        // Either there was one or more invalid fields,
        // or there wasn't even *one* valid field
        return null;
    }

    return validFields;
}

export function collectValidFields(body: Record<string, unknown>, schema: SchemaDefinition, validationMode: TaskValidationMode) {
    // I thought about making this one giant function with the cases defined inside
    // But i think its less readable that way, even if it is less redundant looking.
    switch (validationMode) {
        case TaskValidationMode.CREATE_MINIMUM:
            return collectValidCreateFields(body, schema);
        case TaskValidationMode.UPDATE_PARTIAL:
            return collectValidPartialFields(body, schema);
        default:
            throw new Error("Invalid validation mode");
    }
}

export function validateId(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id)
    // below: short circuit means second condition is only evaluated if first condition is true
    const is_valid_id = Boolean(id) && Number.isInteger(id) && id > 0
    if (is_valid_id) {
        res.locals.id = id
        next()
    } else {
        res.status(400).json({ error: "ID must be a positive integer" })
    }
}