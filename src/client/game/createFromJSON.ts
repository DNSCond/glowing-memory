// createFromJSON
export function traverseObjectToHTML(object: object) {
  // Deep clone, handling BigInts
  object = cloneAsPlainObject(object) as object;

  {
    const result = _traverse(object);
    result.className = "traverseObjectToHTML topLevel";
    return result;
  }

  function _traverse(mixed: any) {
    let result, topType;

    switch (typeofPlus(mixed)) {
      case "object":
        result = document.createElement("dl");
        topType = "object";
        break;
      case "Array":
        result = document.createElement("ol");
        topType = "Array";
        break;
      default:
        result = document.createElement("div");
        result.innerText = String(mixed);
        result.className = "traverseObjectToHTML";
        result.dataset.dataType = Object.prototype.toString.call(mixed);
        return result;
    }

    result.className = "traverseObjectToHTML";
    result.dataset.dataType =
      Object.prototype.toString.call(mixed);

    for (let [key, value] of Object.entries(mixed)) {
      if (topType === "object") {
        result.append(
          Object.assign(document.createElement("dt"), { innerText: String(key) })
        );
      }

      const valueResult = document.createElement(topType === "object" ? "dd" : "li");
      valueResult.append(_traverse(value));
      result.append(valueResult);
    }

    return result;
  }
}

export function typeofPlus(mixed: any) {
  if (Array.isArray(mixed)) return "Array";
  if (mixed === null) return "Null";
  return typeof mixed;
}

function cloneAsPlainObject(object: object | null, proto = null) {
  if (typeof proto !== "object") throw new TypeError;
  switch (typeofPlus(object)) {
    case "object": {
      const result = { __proto__: proto };
      for (let key of Reflect.ownKeys(object as object))
        Reflect.set(result, key, Reflect.get(object as object, key));
      return result;
    } default: return object;
  }
}
