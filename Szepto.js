var sZepto = (function() {
	var emptyArray = [], filter = emptyArray.filter, slice = emptyArray.slice,
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		impleSelectorRE = /^[\w-]*$/,
		class2type = {},
		toString = class2type.toString,
		zepto = {},
		isArray = Array.isArray || 
			function(object) { return object instanceof Array };

	function type(obj) {
		return obj == null ? String(obj) : 
			class2type[toString.call(obj)] || "object";
	}

	function isFunction(value) { return type(value) == "function"; }
	function isWindow(obj)     { return obj != null && obj == obj.window; }
	function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE; }
	function isObject(obj)     { return type(obj) =="object"; }
	// 简单对象
	function isPlainObject(obj) {
		return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
	}

	// 返回数组中不为空的项
	function compact(array) { return filter.call(array, function(item) { return item != null;})}

	function Z(dom,selector) {
		var i = 0,len = dom ? dom.length : 0;
		for (i; i < len; i++) {
			this[i] = dom[i];
		}
		this.length = len;
		this.selector = selector || '';
	}

	zepto.Z = function(dom, selector) {
		return new Z(dom, selector);
	}

	zepto.isZ = function(dom, selector) {
		return object instanceof zepto.Z;
	}

	zepto.init = function(selector, context) {
		var dom;
		// 没有给出selector，返回一个空的Zepto collection
		if(!selector) return zepto.Z();
		// selector是一个字符串
		else if (typeof selector == 'string') {
			selector = selector.trim();

			if (selector[0] == '<' && fragmentRE.test(selector)) {

			}
			// context有值
			else if (context !== undefined) {
				return $(context).find(selector);
			}
			// 是一个CSS选择符
			else {
				dom = zepto.qsa(document, selector);
			}
		}
		// selector是一个函数，当DOM加载完毕调用这个函数
		else if (isFunction(selector)) { return $(document).ready(selector); }
		// 是一个zepto返回值，则返回
		else if (zepto.isZ(selector))  { return selector; }
		else{
			// selector是一个节点数组
			if (isArray(selector)) { dom = compact(selector); }
			// selector是一个对象
			else if (isObject(selector)) { dom = [selector], selector = null; }
			// selector是一个html标签，则创建节点
			else if (fragmentRE.test(selector)) {  }
			// context有值
			else if (context !== undefined) { return $(context).find(selector); }
			else { dom = zepto.qsa(document, selector); }
		}
		return zepto.Z(dom, selector);
	}

	$ = function(selector, context) {
		return zepto.init(selector, context);
	}


	function extend(target, source, deep) {
		for (key in source) {
			if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
				if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
					target[key] = {};
				}
				if (isArray(source[key]) && !isArray(target[key])) {
					target[key] = [];
				}
				// 递归
				extend(target[key], source[key], deep);
			}
			else if (source[key] !== undefined) { target[key] = source[key]; }
		}
	}

	zepto.qsa = function(element, selector) {
		var found,
			maybeID = selector[0] == "#",
			maybeClass = !maybeID && selector[0] == ".",
			nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
			isSimple = simpleSelectorRE.test(nameOnly);
		return (element.getElementById && isSimple && maybeID) ?
			((found = element.getElementById(nameOnly)) ? [found] : []) : 
			(element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
			slice.call(
				isSimple && !maybeID && element.getElementByClassName ? 
				maybeClass ? element.getElementByClassName(nameOnly) : 
				element.getElementByTagName(selector) :
				element.querySelectorAll(selector)
			);
	}
})