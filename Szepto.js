var sZepto = (function() {
	var emptyArray = [], filter = emptyArray.filter, slice = emptyArray.slice,
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		impleSelectorRE = /^[\w-]*$/,
		class2type = {},
		toString = class2type.toString,
		zepto = {},
		tempParent = document.createElement('div'),
		isArray = Array.isArray || 
			function(object) { return object instanceof Array };

	zepto.matches = function(element, selector) {
		if (!selector || !element || element.nodeType !== 1) { return false; }
		var matchesSelector = element.matches || element.webkitMatchesSelector ||
								element.mozMatchesSelector || element.oMatchesSelector ||
								element.matchesSelector;
		if (matchesSelector) { return matchesSelector.call(element, selector); }
		var match, parent = element.parentNode, temp = !parent;
		if (temp) {
			(parent = tempParent).appendChild(element);
			match = ~zepto.qsa(parent, selector).indexOf(element)
			temp && tempParent.removeChild(element);
			return match;			
		}
	}

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

	// 类数组类型
	function likeArray(obj) {
		var length = !!obj && 'length' in obj && obj.length,
			type = $.type(obj);

		return 'function' != type && !isWindow(obj) &&(
			'array' == type || length === 0 || 
			(typeof length == 'number' && length > 0 && (length - 1) in obj)	
		);
 	}

	// 返回数组中不为空的项
	function compact(array) { return filter.call(array, function(item) { return item != null; }); }
	function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array; }

	// 返回给定值和键值的值
	uniq = function(array) { return filter.call(array, function(item, index) { return array.indexOf(item) == index; }); }

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
		if(!selector) { return zepto.Z(); }
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

	$.extend = function(target) {
		var deep, args = slice.call(arguments, 1);
		if (typeof target == 'boolean') {
			deep = target;
			target = args.shift();
		}
		args.forEach(function(arg) { extend(target, arg, depp); });
		return target;
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

	$.contains = document.docmentElement.contains ? 
		function(parent, node) {
			return parent !== node && parent.contains(node);
		} :
		function(parent, node) {
			while (node && (node = node.parentNode)){
				if (node === parent) { return true; }
			}
			return false;
		}

	// 将函数指针赋值给“$”，使其称为“$”的属性
	$.type = type;
	$.isFunction = isFunction;
	$.isWindow = isWindow;
	$.isArray = isArray;
	$.isPlainObject = isPlainObject;

	$.noop = function() {}

	$.each = function(elements, callback) {
		var i, key;
		if (likeArray(elements)) {
			for (i = 0; i < elements.length; i++) {
				if (callback.call(elements[i], i, elements[i]) === false) { return elements; }
			}
		} else {
			for (key in elements) {
				if (callback.call(elements[key], key, elements[key]) === false) { return elements; }
			}
		}
		return elements;
	}

	$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
		class2type[ "[object " + name + "]"] = name.toLowerCase();
	})

	$.isEmptyObject = function(obj) {
		var name;
		for (name in obj) { return false; }
		return true;
	}

	$.isNumberic = function(val) {
		var num = Number(val), type = typeof val;
		return val != null && type != 'boolean' && 
			(type != 'string' || val.length) && 
			!isNaN(num) && isFinite(num) || false;
	}

	$.inArray = function(elem, array, i) {
		return emptyArray.indexOf.call(array, elem, i);
	}

	$.trim = function(str) {
		return str == null ? "" : String.prototype.trim.call(str);
	}

	$.map = function(elements, callback) {
		var value, values = [], i, key;
		if (likeArray(elements)) {
			for (i = 0; i < elements.length; i++) {
				value = callback(elements[i], i);
				if (value != null) { values.push(value); }
			}
		}
		else {
			for (key in elements) {
				value = callback(elements[key], key);
				if (value != null) { values.push(value); }
			}
		}
		return flatten(values);
	}

	$.fn = {
		constructor: zepto.Z,
		length: 0,

		// 函数指针
		forEach: emptyArray.forEach,
		reduce: emptyArray.reduce,
		push: emptyArray.push,
		sort: emptyArray.sort,
		splice: emptyArray.splice,
		indexOf: emptyArray.indexOf,

		concat: function() {
			var i, value, args =[];
			for (i = 0; i < arguments.length; i++) {
				value = arguments[i];
				args[i] = zepto.isZ(value) ? value.toArray() : value;
			}
			return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
		},

		get: function(index) {
			return index === undefined ? slice.call(this) : this[index >= 0 ? index : index + this.length];
		},

		add: function(selector, context) { return $(uniq(this.concat($(selector, context)))); },

		slice: function() { return $(slice.apply(this, arguments)); },

		toArray: function(){ return this.get();	},

		size: function() { return this.length; },

		map: function(fn) { return $($.map(this, function(el, i){ return fn.call(el, i, el) })); },

		is: function(selector) { return this.length > 0 && zepto.matches(this[0], selector); },

		eq: function(index) { return index === -1 ? this.slice(index) : this.slice(index, + index + 1) },

		first: function() {
			var el = this[0];
			return el && !isObject(el) ? el : $(el);
		},

		last: function() {
			var el = this[this.length - 1];
			return el && !isObject(el) ? el : $(el);
		}

		remove: function() {
			return this.each(function() {
				if(this.parentNode != null) { 
					this.parentNode.removeChild(this);
				}
			})
		},

		each: function(callback) {
			emptyArray.every.call(this, function(el, index) {
				return callback.call(el, index,el) !== false;
			});
			return this;
		}

		find: function(selector) {
			var result, $this = this;
			if (!selector) { result = $(); }
			else if (typeof selector == 'object') {
				result = $(selector).filter(function(){
					var node = this;
					return emptyArray.some.call($this, function(parent){
						return $.contains(parent, node);
					})
				})
			}
			else if (this.length == 1) { result = $(zepto.qsa(this[0], selector)); }
			else { result = this.map(function() { retu zepto.qsa(this, selector); }); }
			return result;
		},
	}
})