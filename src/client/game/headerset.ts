import { camelToKebab, cbyte, isValidDate, uppercaseAfterHyphen } from "./FakeFileHelpers.js";

export type HeadersetTSTypes = string | number | boolean | Date | null;

/**
 * about types:
 *
 * the default type is string, so it can be omitted.
 *
 * write a string like "key1=type1,key2=type2,key3=type3", case-insensitive,
 * whitespace ignored "key1 = type1, key2 = type2, key3 = type3".
 *
 * keys must be entered without the "headerset-*" prefix
 *
 * - isodatetime: write a isoString, formatted like Date.prototype.toISOString (or whatever you put in if its invalid)
 * - datetime-global: write a isoString, formatted like Date.prototype.toUTCString
 * - datetime-utc: alias to datetime-global
 * - datetime-local: write a isoString, formatted like Date.prototype.toString
 * - date: write a isoString, formatted like Date.prototype.toUTCString
 * - time: write a isoString, formatted like Date.prototype.toTimeString
 * - bytes: write a number representing bytes, then it formats for humans
 *
 * @param type one of the strings of the above list.
 * @param string the string to compute with.
 * @param keepType whether to convert that to a string.
 * @returns an object with `string` and `type`
 */
export function stringtoType(
    type: string | undefined, string: string | null,
    keepType: boolean = false): { string: HeadersetTSTypes, type: 'time' | 'string' | null, timeValue?: Date } {
    if (string === null) return { string: null, type: 'string' };
    const asIs = { string, type: 'string' } as const;
    if (type === undefined) return asIs;

    const timeValue = new Date(string),
        asTime = {
            string: timeValue,
            type: "time",
            timeValue,
        } as const;
    switch (type) {
        case "isodatetime":
            if (keepType) return asTime;
            if (isValidDate(timeValue)) {
                return {
                    string: timeValue.toISOString(),
                    type: "time", timeValue,
                };
            } else return asIs;
        case "datetime-utc":
        case "datetime-global":
            if (keepType) return asTime;
            return {
                string: timeValue.toUTCString(),
                type: "time", timeValue,
            };
        case "datetime-local":
            if (keepType) return asTime;
            return {
                string: timeValue.toString(),
                type: "time", timeValue,
            };
        case "date":
            if (keepType) return asTime;
            return {
                string: timeValue.toDateString(),
                type: "time", timeValue,
            };
        case "time":
            if (keepType) return asTime;
            return {
                string: timeValue.toTimeString(),
                type: "time", timeValue,
            };
        case "bytes":
            if (keepType) return { string: +string, type: "string" };
            return { string: cbyte(+string), type: "string" };
        default:
    }
    return asIs;
}

export type changes = { changeName: string, oldValue?: string | null | undefined, newValue: string | null };

export class HeadersetUi extends HTMLElement {
    #observer: MutationObserver = new MutationObserver(change => this.#attributeChangedCallback(change));
    #abortController?: AbortController;
    #allowedHeaders!: string[];

    static get observedAttributes(): string[] {
        return ['headerval'];
    }

    constructor(settings: Record<string, HeadersetTSTypes> = {}, allowedHeaders?: string[]) {
        super();
        this.#allowedHeaders = Array.from(allowedHeaders ?? [], s => `${s}`.toLowerCase());
        const head = document.createElement('dl');
        head.className = 'metadata';
        head.style.margin = '1em 0 1em 0';
        this.attachShadow({ mode: 'open' }).append(Object.assign(document.createElement('style'), {
            innerText: `:host{font-family:monospace}
            dt, dd {
                display: inline;
                margin: 0;
            } dt:after {
                content: ": ";
            }

dt { color: #a600a6; }

dd { color: green; }

/*
@media (prefers-color-scheme: dark) {
dt { color: #a600a6; }
dd { color: green; }
}
*/`.replaceAll(/\s+/g, ' '),
        }), head);
        this.setHeaders(settings);
    }

    connectedCallback(): void {
        this.#abortController?.abort();
        /*const {signal} = */
        (this.#abortController = new AbortController);
        this.#observer.observe(this, { attributes: true, attributeOldValue: true });
        this.reconstructHeaders();
    }

    disconnectedCallback(): void {
        this.#abortController?.abort();
        this.#observer.disconnect();
    }

    #attributeChangedCallback(mutationRecords: MutationRecord[]): void {
        const changes: changes[] = [];
        for (const mutationRecord of mutationRecords) {
            const changeName = mutationRecord.attributeName as string,
                lowercaseName = changeName?.toLowerCase();
            if (lowercaseName?.startsWith('headerset-') || this.#allowedHeaders.includes(lowercaseName as string)) {
                const oldValue: string | null = mutationRecord.oldValue;
                const newValue: string | null = this.getAttribute(changeName);
                changes.push({ changeName, oldValue, newValue });
            }
        }
        this.#makeChanges(changes);
    }

    reconstructHeaders() {
        this.shadowRoot!.querySelector('.metadata')!.replaceChildren();
        const changes: changes[] = [];
        for (const changeName of this.getAttributeNames()) {
            const lowercaseName = changeName?.toLowerCase();
            if (lowercaseName?.startsWith('headerset-') || this.#allowedHeaders.includes(lowercaseName as string)) {
                const newValue: string | null = this.getAttribute(changeName);
                const oldValue: null = null;
                changes.push({ changeName, oldValue, newValue });
            }
        }
        this.#makeChanges(changes);
    }

    #makeChanges(changes: changes[]) {
        if (this.shadowRoot) {
            const metadata = this.shadowRoot.querySelector('.metadata')!;
            const elements: { [key: string]: HTMLDivElement } = {},
                missing: string[] = [], changeNames = changes.map(m => m.changeName);
            for (const child of metadata.children) {
                const keyName = (child as HTMLDivElement).dataset?.keyName;
                if (keyName !== undefined) {
                    if (changeNames.includes(keyName)) {
                        elements[keyName as string] = (child as HTMLDivElement);
                    } else {
                        missing.push(keyName as string);
                    }
                }
            }
            for (const changeName of changeNames) {
                if (!(changeName in elements) && !missing.includes(changeName)) {
                    missing.push(changeName);
                }
            }
            for (const string of missing) {
                const keyElement = this.ownerDocument.createElement('dt');
                const valElement = this.ownerDocument.createElement('dd');
                const div = this.ownerDocument.createElement('div');
                div.append(keyElement, valElement);
                div.dataset["keyName"] = string;
                elements[string] = div;
            }
            const changesToMake: HTMLElement[] = [];
            for (const change of changes) {
                if (elements[change.changeName]) {
                    // const {keyElement, valElement} = elements[change.changeName];
                    const keyElement = elements[change.changeName]!.querySelector('dt') ?? undefined;
                    const valElement = elements[change.changeName]!.querySelector('dd') ?? undefined;
                    if (change.newValue === null) {
                        elements[change.changeName]?.remove();
                    }
                    if (keyElement === undefined || valElement === undefined) {
                        throw new TypeError('InternalError');
                    }
                    if (change.newValue) {
                        const span = this.#normalizeValueString(change.changeName, change.newValue);
                        valElement.replaceChildren(span);
                        keyElement.innerText = uppercaseAfterHyphen(change.changeName);
                        changesToMake.push(elements[change.changeName]!);
                    }
                }
            }
            metadata.append(...changesToMake);
        }
    }

    normalizeKeyName(key: string) {
        return (this.#allowedHeaders.includes(key)) || /^headerset-/i.test(key) ? key : `headerset-${key}`;
    }

    #normalizeValueString(name: string, value: string): HTMLSpanElement | HTMLTimeElement {
        const type = this.getHeaderValTypesNotNull().get(name.toLowerCase());
        // return stringtoType(type, value).string as string;
        const result = stringtoType(type, value);
        let span, innerText = result.string as string, dateTime = result.timeValue?.toISOString();
        if (result.type === "time")
            span = Object.assign(this.ownerDocument.createElement('time'), { dateTime, innerText });
        else span = Object.assign(this.ownerDocument.createElement('span'), { innerText });
        return span;
    }

    set headerVal(value: string | null) {
        if (value === null) this.removeAttribute('headerVal');
        else this.setAttribute('headerVal', value);
    }

    get headerVal(): string | null {
        return this.getAttribute('headerVal');
    }

    setHeaderValType(key: string, type: string, overwrite: boolean = false): this {
        return this.setHeaderValTypes((new Map).set(key, type), overwrite);
    }

    setHeaderValTypes(values: Map<string, string>, overwrite: boolean = false): this {
        const result = [], regexp = /^[a-z\-_0-9]+$/i;
        const array = [...this.getHeaderValTypesNotNull()];
        if (overwrite) array.length = 0;
        for (let [key, val] of array.concat([...values])) {
            key = this.normalizeKeyName(key);
            if (regexp.test(key) || regexp.test(val)) {
                result.push(`${key}=${val}`);
            } // else {console.warn('warning setting: key =', key, '; val =', val);}
        }
        this.headerVal = result.join().toLowerCase();
        return this;
    }

    getHeaderValTypes(): Map<string, string> | null {
        const temporary = this.headerVal?.replaceAll(/\s+/g, '');
        if (temporary === undefined) return null;
        const result: Map<string, string> = new Map;
        const types = temporary
            .toLowerCase().split(/,/g)
            .map(m => m.split(/=/g));
        for (const [key, val] of types) {
            if (key === undefined || val === undefined) {
                continue;
            } result.set(key, val);
        }
        return result;
    }

    getHeaderValTypesNotNull(): Map<string, string> {
        return this.getHeaderValTypes() || new Map;
    }

    setHeader(name: string, value: HeadersetTSTypes): this {
        name = `${name}`;
        const headersetName = this.normalizeKeyName(name);
        if (value === null) {
            this.removeAttribute(headersetName);
            return this;
        }
        if (value instanceof Date) {
            value = value.toISOString();
            const overwrite = !this.getHeaderValTypes()?.get(name);
            if (overwrite) {
                this.setHeaderValType(name, 'datetime-global');
            }
        }
        this.setAttribute(headersetName, `${value}`);
        return this;
    }

    setHeaders(keyValues: Record<string, HeadersetTSTypes>): this {
        for (const [key, value] of (Object.entries(keyValues))) {
            this.setHeader(camelToKebab(key), value);
        }
        return this;
    }

    setHeadersMap(keyValues: Map<string, HeadersetTSTypes>): this {
        for (const [key, value] of keyValues) {
            this.setHeader(camelToKebab(key), value);
        }
        return this;
    }


    getHeader(name: string): HeadersetTSTypes {
        name = `${name}`;
        const headersetName = this.normalizeKeyName(name);
        const value = this.getAttribute(headersetName);
        const type = this.getHeaderValTypesNotNull().get(name);
        return stringtoType(type, value, true).string;
    }

    getAllHeaders(): Map<string, HeadersetTSTypes> {
        const result: Map<string, string | boolean | Date> = new Map;
        for (const attribute of this.attributes) {
            const { name, value } = attribute;
            if ((name.startsWith('headerset-')) || (this.#allowedHeaders.includes(name))) {
                result.set(name, value);
            }
        }
        return result;
    }
}

customElements.define('headerset-ui', HeadersetUi);
