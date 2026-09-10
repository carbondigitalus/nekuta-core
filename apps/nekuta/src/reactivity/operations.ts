export const enum TrackOpTypes {
    GET = 'get',
    HAS = 'has',
    ITERATE = 'iterate'
}

export const enum TriggerOpTypes {
    SET = 'set',
    ADD = 'add',
    DELETE = 'delete',
    CLEAR = 'clear'
}

export interface DebuggerEventExtraInfo {
    target: object;
    type: TrackOpTypes | TriggerOpTypes;
    key?: unknown;
    newValue?: unknown;
    oldValue?: unknown;
}
