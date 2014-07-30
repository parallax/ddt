/// <reference path="typings/tsd.d.ts" />
import EventEmitter = require('eventEmitter');
/**
* An enum representing the two different axis
*/
export declare enum DDTAxis {
    X = 0,
    Y = 1,
}
/**
* The result of a bounds calculation.
*/
export declare enum DDTBounds {
    LOW = 0,
    IN = 1,
    HIGH = 2,
}
/**
* Interface for an object containing pageX and pageY events
*/
export interface DDTMouseEvent {
    pageX: number;
    pageY: number;
}
/**
* Little any key vs any value map
*/
export declare class DDTMap<K, V> {
    private keys;
    private values;
    constructor();
    public has(key: K): boolean;
    public get(key: K): V;
    public set(key: K, value: V): DDTMap<K, V>;
    public remove(key: K): DDTMap<K, V>;
}
/**
* A class representing a point which we use across the whole library
*/
export declare class DDTPoint {
    [key: string]: any;
    public x: number;
    public y: number;
    constructor(x: number, y: number);
    public minus(point: DDTPoint): DDTPoint;
    public add(point: DDTPoint): DDTPoint;
    public gt(point: DDTPoint, axis: DDTAxis): boolean;
    public lt(point: DDTPoint, axis: DDTAxis): boolean;
    /**
    * Add a certain amount to a specific axis
    */
    public addToAxis(size: number, axis: DDTAxis): DDTPoint;
    /**
    * Calculation taken from jQuery UI sortable.
    *
    * Used to calculate if a point is over another point by a certain amount
    */
    public isOverAxis(point: DDTPoint, size: number, axis: DDTAxis): boolean;
    static fromEvent: (event: DDTMouseEvent) => DDTPoint;
    static fromElement: (element: Element) => DDTPoint;
    static fromJQuery(jquery: JQuery): DDTPoint;
    static enumToAxis: (axis: DDTAxis) => string;
}
/**
* Used for managing CSS within the library.
*
* Using this class we have a nice API for defining new selectors.
*
* @note This probably doesn't work in any kind of IE, but it's possible for it to by
*       using style.innerText directly. We can probably look at using that in the future.
*/
export declare class DDTCSS {
    static styleElement: HTMLStyleElement;
    static currentIndexes: DDTMap<HTMLStyleElement, number>;
    /**
    * Define a specific selector with some rules for it
    */
    static defineSelector(selectorName: string, rules: Object, newElement?: boolean): HTMLStyleElement;
    static defineClass(className: string, rules: Object, newElement?: boolean): HTMLStyleElement;
    /**
    * Convert an object of rules into a cssText string.
    */
    static rulesToCSS(rules: Object): string;
    /**
    * Convert CamelCase to -camel-case
    */
    static arrowCase(name: string): string;
    /**
    * Remove our node
    *
    * @todo Add support for when extra elements are created
    */
    static cleanup: () => void;
}
/**
* An interface for dealing with elements in our library.
*
* Has some really useful helper functions
*/
export declare class DDTElement {
    static notVisible: string;
    static shadowTable: string;
    static noSelect: string;
    public element: JQuery;
    public emitter: EventEmitter;
    constructor(element: JQuery);
    /**
    * Get the HTMLElement from the jQuery object
    */
    public getNode(): HTMLElement;
    /**
    * Get the offset top of an element from a parent.
    */
    public offsetTop(): number;
    public show(): void;
    public hide(): void;
    public notSelectable(): void;
    public selectable(): void;
    /**
    * Swap two elements in the dom
    *
    * @see http://stackoverflow.com/a/698440/851985
    */
    public swap(element: DDTElement): void;
    /**
    * Calculate if an element is in the bounds of its parent
    */
    public calculateBounds(parent: DDTElement, diffY?: number, positions?: DDTPoint, parentOffset?: number): DDTBounds;
    /**
    * Deep clone an element, with the ability to ignore elements
    */
    public clone(ignoreElements?: Element[], copyStyles?: boolean): DDTElement;
    static getUniqueStyles(element: Element, ignore?: string[]): Object;
    static cloneUniqueStyles(element: Element, clone: Element, ignore?: string[]): void;
    static cloneAttributes(element: Element, clone: Element, ignore?: string[]): void;
    static getInheritedBackgroundColor(el: JQuery): string;
    static getVerticalBorders(el: JQuery): number;
}
export declare class DDTPositionableElement extends DDTElement {
    /**
    * @todo This is far too messy, clean it up
    */
    public attachToCursor(container: JQuery, diff?: DDTPoint, axis?: DDTAxis[], bound?: Element): void;
    public setPosition(point: DDTPoint, axis?: DDTAxis[]): void;
}
export declare class DDTRow extends DDTElement {
}
export declare class DDTShadowRow extends DDTRow {
}
export declare class DDTTable extends DDTPositionableElement {
    public createShadow(row: DDTRow): DDTShadowTable;
    public getTbody(): Element;
}
export declare class DDTShadowTable extends DDTTable {
    public row: DDTShadowRow;
    constructor(element: JQuery);
    public setShadowRow(row: DDTShadowRow): void;
    public fixBackgroundColor(row: DDTRow): void;
    public fixColGroup(row: DDTRow): void;
}
export interface DragAndDropTableOptions {
    verticalOnly?: boolean;
    bindToTable?: boolean;
    cursor?: string;
    valueAttribute?: string;
    shadowContainer?: Element;
    containment?: Element;
}
export declare class DragAndDropTable extends EventEmitter {
    public options: DragAndDropTableOptions;
    static defaultOptions: DragAndDropTableOptions;
    static hasCreatedSelectors: boolean;
    private table;
    private $rows;
    private lastValues;
    private couldHaveChanged;
    private _options;
    private static window;
    private static $document;
    private rowSelector;
    private cache;
    constructor(table: JQuery, options?: DragAndDropTableOptions);
    public wireEvents(): void;
    public dragRow(rowElement: JQuery, mousePosition: DDTPoint): void;
    public disable(): void;
    public enable(): void;
    public isEnabled: () => boolean;
    private getMovingAxis;
    private getRows;
    private calculateValues;
    private cacheRowPoints();
    private getBindingElement();
    private static calculateOffBy(row, tbody);
    private dragged(row, shadow, point);
    private endDrag(row, shadow, cssEl);
    private handleRowSwapping(row, shadow, point);
    private hasChanged(values?);
    private emitValues(values?);
    private swap(row, toSwapWith, shadow);
    private calculateRowToSwapWith(currentRow, point, shadow, rowCoords?);
    private handleScrolling(shadow);
    static createSelectors(): void;
}
export declare function init(table: JQuery, options?: DragAndDropTableOptions): DragAndDropTable;
