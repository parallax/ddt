/**
 * lib.d.ts doesn't include these properties on event for some reason.
 */
interface Event {
    pageX : number;
    pageY : number;

    currentTarget : Element;
}