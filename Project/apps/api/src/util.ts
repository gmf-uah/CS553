import type { RequestHandler, Response } from "express";

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function internalServerError(error: unknown, message: string, res: Response) {
    const errorMessage = `Internal Server Error: ${message}`;
    console.error(errorMessage, error);
    return res.status(500).json({ error: errorMessage });
}

export function handleDatabaseWriteError(
    error: unknown,
    res: Response,
    fallbackMessage: string,
) {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
    ) {
        if (error.code === "23503") {
            return res.status(400).json({
                error: "Invalid foreign key reference. Related record does not exist.",
            });
        }
    }

    return internalServerError(error, fallbackMessage, res);
}

// see big comment below these type definitions
type Payload = Record<string, unknown>; // records are basically JSON objects

type CreateAction<T> = (payload: Payload, fields: string[]) => Promise<T>;
type GetByIdAction<T> = (id: number) => Promise<T | null>;
type UpdateAction<T> = (
    id: number,
    payload: Payload,
    fields: string[],
) => Promise<T | null>;
// type ReplaceAction<T> = (
//     id: number,
//     payload: Payload,
//     fields: string[],
// ) => Promise<T | null>;
type ReplaceAction<T> = UpdateAction<T>;
type DeleteAction = (id: number) => Promise<boolean>;
type NotFoundMessage = (id: number) => string;

type WriteOptions = {
    writeErrorMessage: string;
};

type FoundByIdOptions<T> = {
    notFoundMessage: NotFoundMessage
    actionErrorMessage: string;
    action: GetByIdAction<T>;
};

type UpdateOptions<T> = WriteOptions & {
    notFoundMessage: NotFoundMessage
    updater: UpdateAction<T>;
};

type ReplaceOptions<T> = WriteOptions & {
    notFoundMessage: NotFoundMessage
    replacer: ReplaceAction<T>;
}; // aggravating how i cant just make this a copy of UpdateOptions

type DeleteOptions = WriteOptions & {
    notFoundMessage: NotFoundMessage
    deleter: DeleteAction;
};

// at first, taskRegistration.ts' routes were copy-pasted to userRegistration, projectRegistration
// then, to reduce redundancy I made this util file where they all 'inherit' from higher-order functions.
// These higher-order functions return the async paths that get called upon post/get/patch, etc.
// Soemtimes they accept parameters like creator, updater depending on the type of route.
export function createPostHandler<T>(
    creator: CreateAction<T>,
    options: WriteOptions,
): RequestHandler {
    return async (req, res) => {
        try {
            // It looks like we're just sending the request body to the database raw here
            // but in reality, 2 things are going on here for safety, so rest assured no SQL injection
            // 1. validateTask is called before this route anon function is called
            // 2. createTask only accepts valid fields from the request body, hence the second argument.
            const created = await creator(req.body as Payload, res.locals.validFields);
            res.status(201).json(created);
        } catch (error) {
            handleDatabaseWriteError(error, res, options.writeErrorMessage);
        }
    };
}

export function createGetByIdHandler<T>(
    options: FoundByIdOptions<T>,
): RequestHandler {
    return async (_req, res) => {
        try {
            const record = await options.action(res.locals.id);
            if (record) {
                res.json(record);
            } else {
                res.status(404).json({ error: options.notFoundMessage(res.locals.id) });
            }
        } catch (error) {
            internalServerError(error, options.actionErrorMessage, res);
        }
    };
}

export function createPutHandler<T>(options: ReplaceOptions<T>): RequestHandler {
    return async (req, res) => {
        try {
            const replaced = await options.replacer(
                res.locals.id,
                req.body as Payload, // request bodies are JSON
                res.locals.validFields,
            );
            if (replaced) {
                res.json(replaced);
            } else {
                res.status(404).json({ error: options.notFoundMessage(res.locals.id) });
            }
        } catch (error) {
            handleDatabaseWriteError(error, res, options.writeErrorMessage);
        }
    };
}

export function createPatchHandler<T>(options: UpdateOptions<T>): RequestHandler {
    return async (req, res) => {
        try {
            const updated = await options.updater(
                res.locals.id,
                req.body as Payload,
                res.locals.validFields,
            );
            // 1. identify the id the user wishes to update
            // 2. get the request body for what data the user is updating
            // 3. only allow the user to update fields that the server evaluated as valid
            // ignore extraneous fields sent by the user; reject the request outright if there is a type mismatch
            if (updated) {
                res.json(updated);
            } else {
                res.status(404).json({ error: options.notFoundMessage(res.locals.id) });
            }
        } catch (error) {
            handleDatabaseWriteError(error, res, options.writeErrorMessage);
        }
    };
}

export function createDeleteHandler(options: DeleteOptions): RequestHandler {
    return async (_req, res) => {
        try {
            const deleted = await options.deleter(res.locals.id);
            if (deleted) {
                res.status(204).end();
            } else {
                res.status(404).json({ error: options.notFoundMessage(res.locals.id) });
            }
        } catch (error) {
            handleDatabaseWriteError(error, res, options.writeErrorMessage);
        }
    };
}