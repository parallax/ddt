declare module "eventEmitter" {
    class EventEmitter {
        emitEvent(evt:string, params:any[]):EventEmitter;
        emitEvent(evt:RegExp, params:any[]):EventEmitter;
        trigger(evt:string, params:any[]):EventEmitter;
        trigger(evt:RegExp, params:any[]):EventEmitter;
        addListener(evt:string, listener:Function):EventEmitter;
        addListener(evt:RegExp, listener:Function):EventEmitter;
        on(evt:string, listener:Function):EventEmitter;
        on(evt:RegExp, listener:Function):EventEmitter;
    }

    export = EventEmitter;
}
