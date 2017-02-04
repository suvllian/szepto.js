(function(global, factory) {
	if (typeof define === 'function' && define.amd) {
		define(function() { return factory(global) });
	} else {
		factory(global);
	}
}(this, function(window){
	var sZepto = (function() {
		var emptyArray = [], classList, filter = emptyArray.filter, slice = emptyArray.slice,
			fragmentRE = /^\s*<(\w+|!)[^>]*>/,
			readyRE = /complete|loaded|interactive/,
			simpleSelectorRE = /^[\w-]*$/,
			class2type = {},
			toString = class2type.toString,
			zepto = {},
			tempParent = document.createElement('div'),
			adjacencyOperators = ['after', 'prepend', 'before', 'append'],
			propMap = {
				'tabindex': 'tabIndex',
				'readonly': 'readOnly',
				'for': 'htmlFor',
				'class': 'className',
				'maxlength':'maxLength',
				'cellspacing': 'cellSpacing',
				'cellpadding': 'cellPadding',
				'rowspan': 'rowSpan',
				'colspan': 'colSpan',
				'usemap': 'useMap',
				'frameborder': 'frameBorder',
				'contenteditable': 'contentEditable'
			},
			uniq,
			isArray = Array.isArray || 
				function(object) { return object instanceof Array };

		// 判断一个元素是否匹配给定的选择器
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
		// 得到一个数组的副本
		function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array; }

		// 数组去重，如果数据在数组中的位置和索引不同，则有相同的项
		uniq = function(array) { return filter.call(array, function(item, index) { return array.indexOf(item) == index; }); }

		function classRE(name) {
			return name in classCache ? 
				classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
		}

		function maybeAddPx(name, value){
			return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value; 
		}

		// children属性不存在则遍历childNodes，如果是Node类型则返回
		// 返回是一个数组
		function children(element) {
			return 'children' in  element ? 
				slice.call(element.children) : $.map(element.childNodes, function(node) {if (node.nodeType == 1) return node;})
		}

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
					dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
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
				else if (fragmentRE.test(selector)) { 
					dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null; 
				}
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

		function filtered(nodes, selector) {
			return selector == null ? $(nodes) : $(nodes).filter(selector);
		}

		// 判断是否包含指定节点
		// document.documentElement.contains是IE特有的方法
		// 其他浏览器则循环判断
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

		// arg是函数则执行，否则直接返回arg
		function funcArg(node, arg, index, payload) {
			return isFunction(arg) ? arg.call(context, index, payload) : arg;
		}

		function setAttribute(node, name, value) {
			value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
		}

		// 如果传递了value，则修改node的class，没有传递则返回node的class
		function className(node, value) {
			var klass = node.className || '',
				svg   = klass && klass.baseVal !== undefined;
			if (value === undefined) { return svg ? klass.baseVal :klass; }
				svg ? (klass.baseVal = value) : (node.className = value);
		}

		// 获取节点默认的display属性
		function defaultDisplay(nodeName){
			var element, display;
			if (!elementDisplay[nodeName]) {
				element = document.createElement(nodeName);
				document.body.appendChild(element);
				display = getComputedStyle(element, '').getPropertyValue("display");
				element.parentNode.removeChild(element);
				display == "none" && (display = "block");
				elementDisplay[nodeName] = display;
			}
			return elementDisplay[nodeName];
		}

		// 将函数指针赋值给“$”，使其称为“$”的属性
		$.type = type;
		$.isFunction = isFunction;
		$.isWindow = isWindow;
		$.isArray = isArray;
		$.isPlainObject = isPlainObject;


		$.uuid = 0;
		$.support = { };
		$.expr = {};
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

		$.grep = function(elements, callback) {
			return filter.call(elements, callback);
		}

		if (window.JSON) { $.parseJSON = JSON.parse; }

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

		// 1、如果elements是类数组类型，则对数组成员执行回调函数
		// 是对象对elements属性执行回调函数
		// 2、将回调函数执行结果存入values数组中。
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

			// 判断文档是否加载完成
			// 1、通过判断document.readyState属性
			// 2、通过DOMContentLoaded事件判断
			ready: function(callback) {
				if (readyRE.test(document.readyState) && document.body) { callback($) }
				else { document.addEventListener('DOMContentLoaded', function(){ callback($)}, false)}
				return this;
			},

			// 对this中的每个节点执行函数，将其parentNode赋值给node，
			// 直至parentNode为document，且ancestors数组中不存在该节点，则将其存入数组中
			// 最后返回数组
			parents: function(selector) {
				var ancestors = [], nodes = this;
				while (nodes.length > 0) {
					nodes = $.map(nodes, function(node){
						if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
							ancestors.push(node);
							return node;
						}
					})
				}
				 return filtered(ancestors, selector);
			},

			// 返回所有兄弟节点
			// 通过该节点的父亲节点得到NodeList，然后返回除了自己的数组。
			siblings: function(selector) {
				return filtered(this.map(function(i, el){
					return filter.call(children(el.parentNode), function(child) { return child !== el;})
				}), selector);
			}

			// 返回selector最先匹配的祖先元素
			closest: function(selector, context) {
				var nodes = [], collection = typeof selector == 'object' && $(selector);
				this.each(function(_, node){
					while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector))){
						node = node !== context && !isDocument(node) && node.parentNode;
					}
					if (node && nodes.indexOf(node) < 0) { nodes.push(node); }
				})
				return $(nodes);
			}

			// 添加对象形成一个新数组
			concat: function() {
				var i, value, args =[];
				for (i = 0; i < arguments.length; i++) {
					value = arguments[i];
					args[i] = zepto.isZ(value) ? value.toArray() : value;
				}
				return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
			},

			// 过滤对象集合
			// 如果参数是函数，在函数返回有实际值时，元素被返回
			// 双重否定
			filter: function(selector) {
				if (isFunction(selector)) { return this.not(this.not(selector)); }
				return $(filter.call(this, function(element){
					return zepto.matches(element, selector);
				}))
			},

			// 判断当前对象集合是否有符合选择器的元素，或者是否包含指定DOM节点
			// 有则返回新的对象集合
			has: function(selector) {
				return this.filter(function(){
					return isObject(selector) ? 
						$.contains(this, selector) : 
						$(this).find(selector).size();
				})
			},

			// 将要替换的内容插入被替换的内容之前，然后删除被替换的内容
			replaceWith: function(newContent) {
				return this.before(newContent).remove();
			},

			// 在匹配的元素外层包上一个html元素
			// 如果传入是字符串，则先创建DOM节点
			warp: function(structure) {
				var func = isFunction(structure);
				if (this[0] && !func) {
					var dom = $(structure).get(0),
						clone = dom.parentNode || this.length > 1;
				}

				return this.each(function(index){
					$(this).warpAll(
						func ? structure.call(this, index) :
							clone ? dom.cloneNode(true) : dom
					)
				})
			},

			// 在所有匹配的元素外面包一个单独的结构
			warpAll: function(structure){
				$(this[0]) {
					$(this[0]).before(structure = $(structure));
					var children;
					while ((children = structure.children()).length) { structure = children.first() }
					$(structure).append(this);
				}
				return this;
			},

			// 将匹配的内容包裹在单独的结构中
			warpInner: function(structure) {
				var func = isFunction(structure);
				return this.each(function(index){
					var self = $(this), contents = self.contents(),
						dom = func ? structure.call(this, index) : structure;
					contents.length ? contents.warpAll(dom) : self.append(dom)
				})
			},

			// 移除集合中元素的直接父节点，并将他们的子元素保留在原来的位置
			unwarp: function(){
				this.parent().each(function(){
					$(this).replaceWith($(this).children())
				})
				return this;
			},

			// 根据setting的布尔值显示或隐藏元素
			toggle: function(setting){
				return this.each(function(){
					var el = $(this);
					(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
				})
			},

			// 如果参数是函数，则执行函数，返回函数值为false的对象集合
			// 如果是其他类型，则将其转换成zepto对象集合，并返回不在其中的元素的对象集合
			not: function(selector) {
				var nodes = [];
				if (isFunction(selector) && selector.call !== undefined){
					this.each(function(index){
						if (!selector.call(this, index)){
							nodes.push(this);
						}
					})
				} else {
					var excludes = typeof selector == 'string' ? this.filter(selector) :
						(likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector);
					this.forEach(function(el){
						if (excludes.indexOf(el) < 0) {
							nodes.push(el);
						}
					})
				}
				return $(nodes);
			},

			// 从当前对象集合中获取所有元素或单个元素
			// 返回的是DOM节点
			get: function(index) {
				return index === undefined ? slice.call(this) : this[index >= 0 ? index : index + this.length];
			},

			// 添加元素到集合中
			add: function(selector, context) { return $(uniq(this.concat($(selector, context)))); },

			// 提取数组的子集
			slice: function() { return $(slice.apply(this, arguments)); },

			// 
			toArray: function(){ return this.get();	},

			// 对象集合中元素的数量
			size: function() { return this.length; },

			// 传入函数，对this中每个成员执行函数
			// 将函数执行结果传入构造函数，返回Node类型
			map: function(fn) { return $($.map(this, function(el, i){ return fn.call(el, i, el) })); },

			is: function(selector) { return this.length > 0 && zepto.matches(this[0], selector); },

			// 从对象集合中获取给定索引值的元素
			eq: function(index) { return index === -1 ? this.slice(index) : this.slice(index, index + 1) },

			// 获取当前对象集合的第一个元素
			first: function() {
				var el = this[0];
				return el && !isObject(el) ? el : $(el);
			},

			// 获取当前对象集合的最后一个元素
			last: function() {
				var el = this[this.length - 1];
				return el && !isObject(el) ? el : $(el);
			}

			// 从父节点中删除当前集合中的元素
			remove: function() {
				return this.each(function() {
					if(this.parentNode != null) { 
						this.parentNode.removeChild(this);
					}
				})
			},

			// 对this中的每一项都执行回调函数
			// 如果回调函数返回false，则循环停止	
			each: function(callback) {
				emptyArray.every.call(this, function(el, index) {
					return callback.call(el, index, el) !== false;
				});
				return this;
			},

			// 获取直接父元素
			parent: function(selector) { return filtered(uniq(this.pluck('parentNode')), selector); },

			// 获取对象集合中元素的直接子元素
			children: function(selector) { return filtered(this.map(function(){ return children(this) }), selector); },

			// 获取元素集合的子元素，包括文字和注释
			contents: function() {
				return this.map(function() { return this.contentDocument || slice.call(this.childNodes)})
			},

			// 深度克隆赋值集合中所有元素
			clone: function(){ return this.map(function(){ return this.cloneNode(true) }) },

			// 查找符合CSS选择器的元素的后代元素
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

			// 清空对象集合中每个元素的DOM内容
			empty: function(){ return this.each(function(){ this.innerHTML = ''}); },

			// 获取对象集合中每一个元素的属性值
			pluck: function(property) { return $.map(this, function(el) { return el[property] } )},

			// 显示元素
			show:function(){
				return this.each(function(){
					this.style.display == "none" && (this.style.display = '')
					if (getComputedStyle(this, '').getPropertyValue("display") == "none") {
						this.style.display = defaultDisplay(this.nodeName);
					}
				})
			},

			// 隐藏元素
			hide: function(){ return this.css("display", "none"); },

			// 获取或设置对象集合中元素的HTML内容
			// 如果没有给定参数，则返回对象集合中第一个元素的的innerHTML
			// 如果给定参数，则用其替换每个元素的内容
			// 参数是函数，则执行
			html: function(html) {
				return 0 in arguments ?
					this.each(function(index){
						var originHtml = this.innerHTML;
						$(this).empty().append(funcArg(this, html, index, originHtml))
					}) :
					(0 in this ? this[0].innerHTML : null);
			}

			// element存在则返回其位置，不存在则返回this第一项在this中的位置
			index: function(element) {
				return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
			},

			// 判断对象集合中的元素是否含有指定的class
			hasClass: function(name) {
				if (!name) { return false;}
				return emptyArray.some.call(this, function(el){
					return this.test(className(el));
				}, classRE(name));
			},

			// 为元素添加class
			addClass: function(name) {
				if (!name) { return this; }
				return this.each(function(index){
					if (!('className' in this)) { return }
					classList = [];
					var cls = className(this), newName = funcArg(this, name, index, cls);
					newName.split(/\s+/g).forEach(function(klass){
						if (!$(this).hasClass(klass)) { classList.push(klass) }
					}, this);
					classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "));
				})
			},

			attr: function(name, value){
				var result;
				return (typeof name == 'string' && !(1 in arguments)) ? 
					(0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
					this.each(function(index){
						if (this.nodeType !== 1) { return }
						if (isObject(name)) {
							for (key in name) { setAttribute(this, key, name[key]) }
						} else {
							setAttribute(this, name, funcArg(this, value, index, this.getAttribute(name)))
						}
					})
			},

			removeAttr: function(name) {
				return this.each(function(){
					this.nodeType === 1 && name.split(' ').forEach(function(attibute){
						setAttribute(this, attibute);
					}, this)
				})
			},

			prev: function(selector) { return $(this.pluck('previousElementSibling')).filter(selector || '*') },
			next: function(selector) { return $(this.pluck('nextElementSibling')).filter(selector || '*') },

			val: function(value) {
				if (0 in arguments) {
					if (value == null) { value = ""; }
					return this.each(function(index){
						this.value = funcArg(this, value, index, this.value);
					})
				} else {
					return this[0] && (this[0].multiple ? 
						$(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') : 
						this[0].value);
				}
			},

			data: function(name, value){
				var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();
				var data = (1 in arguments) ? 
					this.attr(attrName, value) : 
					this.attr(attrName);
				return data !== null ? deserializeValue(data) : undefined;
			},

			text: function(text) {
				return 0 in arguments ? 
					this.each(function(index){
						var newText = funcArg(this, text, index, this.textContent);
						this.textContent = newText == null ? '' : '' + newText;
					}) :
					(0 in this ? this.pluck('textContent').join("") : null);
			},

			prop: function(name, value) {
				name = propMap[name] || name;
				return (1 in arguments) ? 
					this.each(function(index){
						this[name] = funcArg(this, value, index, this[name]);
					}) : 
					(this[0] && this[0][name]);
			},

			removeProp: function(name){
				name = propMap[name] || name;
				return this.each(function() { delete this[name] });
			},

			offset: function(coordinates){
				if (coordinates) { return this.each(function(index){
					var $this = $(this),
						coords = funcArg(this, coordinates, index, $this.offset()),
						parentOffset = $this.offsetParent().offset(),
						props = {
							top: coords.top - parentOffset.top,
							left: coords.left - parentOffset.left
						};
					if ($this.css('position' == 'static')) { props['position'] = 'relative';}
					$this.css(props);
				})}
				if (!this.length) { return null; }
				if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0])){
					return {top: 0, left: 0}
				}
				var obj = this[0].getBoundingClientRect();
				return {
					left: obj.left + window.pageXOffset,
					top: obj.top + window.pageYOffset,
					width: Math.round(obj.width),
					height:Math.round(obj.height)
				}

			},

			position:function(){
				if (!this.length) { return }
				var elem = this[0],
					offsetParent = this.offsetParent(),
					offset = this.offset(),
					parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {top: 0, left: 0} : offsetParent.offset();

				offset.top -= parseFloat($(elem).css('margin-top')) || 0;
				offset.left -= parseFloat($(elem).css('margin-left')) || 0;

				parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0;
				parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0;

				return {
					top: offset.top - parentOffset.top,
					left: offset.left - parentOffset.left
				}
			},

			css: function(property, value) {
				if (arguments.length < 2){
					var element = this[0]
					if (typeof property == 'string') {
						if (!element) { return }
						return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property);
					} else if (isArray(property)) {
						if (!element) { return }
						var props = {}
						var computedStyle = getComputedStyle(element, '')
						$.each(property, function(_, prop){
							props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
						})
						return props;
					}
				}

				var css = '';
				if (type(property) == 'string') {
					if (!value && value !== 0){
						this.each(function() { this.style.removeProperty(dasherize(property)) });
					} else {
						css = dasherize(property) + ":" + maybeAddPx(property, value);
					}
				} else {
					for (key in property){
						if (!property[key] && property[key] !== 0){
							this.each(function() { this.style.removeProperty(dasherize(key)) })
						} else {
							css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ";"
						}
					}
				}

				return this.each(function(){ this.style.cssText += ';' + css })
			},

			scrollTop: function(value) {
				if (!this.length) { return }
				var hasScrollTop = 'scrollTop' in this[0];
			if (value === undefined) { return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset}
			return this.each(hasScrollTop ? 
				function(){ this.scrollTop = value } : 
				function(){ this.scrollTo(this.scrollX, value) });
			},

			scrollLeft: function(value) {
				if (!this.length) { return }
					var hasScrollLeft = 'scrollLeft' in this[0];
				if (value === undefined) { return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset }
				return this.each(hasScrollLeft ?
					function(){ this.scrollLeft = value } : 
					function(){ this.scrollTo(value, this.scrollY) })
			},

			offsetParent: function(){
				return this.map(function(){
					var parent = this.offsetParent || document.body;
					while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static"){
						parent = parent.offsetParent;
					}
					return parent;
				})
			},

			toggleClass: function(name, when) {
				if (!name) { return this }
				return this.each(function(index){
					var $this = $(this), names = funcArg(this, name, index, className(this));
					names.split(/\s+/g).forEach(function(klass){
						(when === undefined ? !$this.hasClass(klass) : when) ? 
						$this.addClass(klass) : $this.removeClass(klass);
					})
				}) 
			},

			removeClass: function(name){
				return this.each(function(index){
					if (!('className' in this)) { return }
					if (name === undefined) { return className(this, '') }
					classList = className(this);
					funcArg(this, name, index, classList).split(/\s+/g).forEach(function(klass) {
						classList = classList.replace(classRE(klass), " ");
					});
					className(this, classList.trim());
				}
			}
		}

		$.fn.detach = $.fn.remove;

		['width','height'].forEach(function(dimension){
			var dimensionProperty = dimension.replace(/./, function(m){ return m[0].toUpperCase() });

			$.fn[dimension] = function(value) {
				var offset, el = this[0];
				if (value === undefined) { return isWindow(el) ? el['inner' + dimensionProperty] : 
					isDocument(el) ? el.documentElement['scroll' + dimensionProperty] : 
					(offset = this.offset()) && offset[dimension];
				} else {
					return this.each(function(index) {
						el = $(this);
						el.css(dimension, funcArg(this, vlaue, index, el[dimension]()))
					})
				}
			}
		})

		function traverseNode(node, fun){
			fun(node);
			for (var i = 0, len = node.childNodes.length; i < len; i++) {
				traverseNode(node.childNodes[i], fun);
			}
		}

		adjacencyOperators.forEach(function(operator, operatorIndex){
			var inside = operatorIndex % 2;
			$.fn[operator] = function(){
				var argType, nodes = $.map(arguments, function(arg){
					var arr = [];
					argType = type(arg);
					if (argType == "array") {
						arg.forEach(function(el){
							if (el.nodeType !== undefined) { return arr.push(el); }
							else if ($.zepto.isZ(el)) { return arr = arr.concat(el.get()) }
								arr = arr.concat(zepto.fragment(el))
						})
						return arr;
					}
					return argType = "object" || arg == null ? 
							arg : zepto.fragment(arg);
				}),
				parent, copyByClone = this.length > 1;

				if (nodes.length < 1) {return this; }

				return this.each(function(_, target){
					parent = inside ? target : target.parentNode;

					target = operatorIndex == 0 ? target.nextSibling : 
							 operatorIndex == 1 ? target.firstChild : 
							 operatorIndex == 2 ? target :
							 null;

					var parentInDocument = $.contains(document.documentElement, parent);

					nodes.forEach(function(node){
						if (copyByClone) { node = node.cloneNode(true); }
						else if (!parent) { return $(node).remove() }

						parent.insertBefore(node, target);
						if (parentInDocument){
							traverseNode(node, function(el) {
								if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
									(!el.type || el.type === 'text/javascript') && !el.src){
									var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
									target['evel'].call(target, el.innerHTML);
								}
							})
						}
					})
				})
			}
		})

		$.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html){
			$(html)[operator](this);
			return this;
		}

		zepto.Z.prototype = Z.prototype = $.fn;

		zepto.uniq = uniq;
		zepto.deserializeValue = deserializeValue;
		$.zepto = zepto;

	})();

	// 将zepto对象赋值成为window对象的属性
	window.Zepto = Zepto;
	window.$ === undefined && (window.$ = Zepto);

	(function($){
		var _zid = 1, undefined,
			slice = Array.prototype.slice,
			isFunction = $.isFunction,
			isString = function(obj) { return typeof obj == 'string' },
			handlers = { },
			specialEvents = {},
			focusinSupported = 'onfocusin' in window,
			focus = { focus: 'focusin', blur: 'focusout' },
			hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

		specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

		function zid(element) {
			return element._zid || (element._zid = _zid++ );
		}

		function findHandlers(element, event, fn, selector) {
			event = parse(event);
			if (event.ns) { var matcher = matcherFor(event.ns); }
			return (handlers[zid(element)] || []).filter(function(handler){
				return handler 
					&& (!event.e  || handler.e == event.e)
					&& (!event.ns || matcher.test(handler.ns))
					&& (!fn       || zid(handler.fn) === zid(fn))
					&& (!selector || handler.sel == selector)
			})
		}

		function parse(event) {
			var parts = ('' + event).split('.');
			return {e: parts[0], ns: parts.slice(1).sort().join(' ') }
		}

		function matcherFor(ns) {
			return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
		}

		function eventCapture(handler, captureSetting) {
			return handler.del && 
				(!focusinSupported && (handler.e in focus)) ||
				!!captureSetting
		}

		function realEvent(type) {
			return hover[type] || (focusinSupported && focus[type]) || type
		}

		function add(element, events, fn, data, selector, delegator, capture) {
			var id = zid(element), set = (handlers[id] || (handlers[id] = []));
			events.split(/\s/).forEach(function(event){
				if (event == 'ready') { return $(document).ready(fn) }
				var handler = parse(event);
				handler.fn  = fn;
				handler.sel = selector;

				if (handler.e in hover) {
					fn = function(e) {
						var related = e.relatedTarget;
						if (!related || (related !== this && !$.contains(this, related))) {
							return handler.fn.apply(this, arguments);
						}
					}
				}

				handler.del = delegator;
				var callback = delegator || fn;
				handler.proxy = function(e){
					e = compatible(e);
					if (e.isImmediatePropagationStopped()) { return }
						e.data = data;
					var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
					if (result === false) { e.preventDefault(), e.stopPropagation() }
					return result;
				}

				handler.i = set.length;
				set.push(handler);
				if ('addEventListener' in element) {
					element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
				}
			})
		}

		function remove(element, events, fn, selector, capture){
			var id = zid(element);
			(events || '').split(/\s/).forEach(function(event){
				findHandlers(element, event, fn,selector).forEach(function(handler){
					delete handlers[id][handler.i];
					if ('removerEventListener' in element) {
						element.removerEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
					}
				})
			})
		}

		$.event = { add: add, remove: remove};

		$.proxy = function(fn, context){
			var args = (2 in arguments) && slice.call(arguments, 2);
			if (isFunction(fn)) {
				var proxyFn = function() { return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments )}
				proxyFn._zid = zid(fn);
				return proxyFn;
			} else if (isString(context)) {
				if (args) {
					args.unshift(fn[context], fn);
					return $.proxy.apply(null, args);
				} else {
					return $.proxy(fn[context], fn);
				}
			} else {
				throw new TypeError("excepted function");
			}
		}

		$.fn.bind = function(event, data, callback) {
			return this.on(event, data, callback);
		}

		$.fn.unbind = function(event, callback) {
			return this.off(event, callback);
		}

		$.fn.one = function(event, selector, data, callback) {
			return this.on(event, selector, data,callback, 1);
		}

		var returnTrue  = function() { return true; },
			returnFalse = function() { return false; },
			ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
			eventMethods = {
				preventDefault: 'isDefaultPrevented',
				stopImmediatePropagation: 'isImmediatePropagationStopped',
				stopPropagation: 'isPropagationStopped'
			} 

		function compatible*(event, source) {
			if (source || !event.isDefaultPrevented) {
				source || (source = event);

				$.each(eventMethods, function(name, predicate) {
					var sourceMethod = source[name];
					event[name] = function(){
						this[predicate] = returnTrue;
						return sourceMethod && sourceMethod.apply(source, arguments);
					}
					event[predicate] = returnFalse;
				})

				event.timeStamp || (event.timeStamp = Date.now())

				if (source.defaultPrevented !== undefined ? source.defaultPrevented : 
					'returnValue' in source ? source.returnValue === false :
					source.getPreventDefault && source.getPreventDefault()){
					event.isDefaultPrevented = returnTrue
				}
			}
			return event;
		}

		function createProxy(event) {
			var key, proxy = { originalEvent: event }
			for (key in event) {
				if (!ignoreProperties.test(key) && event[key] !== undefined) { proxy[key] = event[key] }
			}
			return compatible(proxy, event);
		}

		$.fn.delegate = function(selector, event, callback) {
			return this.on(event, selector, callback);
		}

		$.fn.undelegate = function(selector, event, callback) {
			return this.off(event, selector, callback);
		}

		$.fn.live = function(event, callback) {
			$(document.body).delegate(this.selector, event, callback);
		}

		$.fn.die = function(event, callback){
			$(document.body).undelegate(this.selector, event, callback);
		}

		$.fn.on = function(event, selector, data, callback, one) {
			var autoRemove, delegator, $this = this;
			if (event && !isString(event)) {
				$.each(event, function(type, fn) {
					$this.on(type, selector, data, fn, one);
				})
				return $this;
			}

			if (!isString(selector) && !isFunction(callback) && callback !== false){
				callback = data, data = selector, selector = undefined;
			}
			if (callback === undefined || data === false){
				callback = data, data = undefined;
			}
			if (callback === false) { callback = returnFalse; }

			return $this.each(function(_,element){
				if (one) {
					autoRemove = function(e){
						remove(element, e.type, callback);
						return callback.apply(this, arguments);
					}
				}

				if (selector) {
					delegator = function(e) {
						var evt, match = $(e.target).closest(selector, element).get(0);
						if (match && match !== element) {
							evt = $.extend(createProxy(e), {currentTarget:match, liveFired: element})
							return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
						}
					}
				}

				add(element, event, callback, data, selector, delegator || autoRemove)
			})
		}

		$.fn.off = function(event, selector, callback) {
			var $this = this;
			if (event && !isString(event)) {
				$rach(event, function(type, fn){
					$this.off(type, selector, fn)
				})
				return $this;
			}

			if (!isString(selector) && !isFunction(callback) && callback !== false){
				callback = selector, selector = undefined;
			}

			if (callback === false) { callback = returnFalse; }

			return $this.each(function(){
				remove(this, event, callback, selector);
			})
		}

		$.fn.trigger = function(event, args) {
			event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event);
			event._args = args;
			return this.each(function(){
				if (event.type in focus && typeof this[event.type] == "function") { this[event.type]() }
				else if ('dispatchEvent' in this) { this.dispatchEvent(event) }
				else { $(this).triggerHandler(event, args) }
			})
		}

		$.fn.triggerHandler = function(event, args) {
			var e, result;
			this.each(function(i, element){
				e = createProxy(isString(event) ? $.Event(event) : event);
				e._args = args;
				e.target = element;
				$.each(findHandlers(element, event.type || event), function(i, handler){
					result = handler.proxy(e);
					if (e.isImmediatePropagationStopped()) { return false; }
				})
			})
			return result;
		}

		('focusin focusout focus blur load resize scroll unload click dbclick ' +
			'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' + 
			'change select keydown keypress keyup error').split(' ').forEach(function(event){
				$.fn[event] = function(callback){
					return (0 in arguments) ? 
						this.bind(event, callback) :
						this.trigger(event);
				}
			})

		$.Event = function(type, props){
			if (!isString(type)) { props = type, type = props.type; }
			var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true;
			if (props) {
				for (var name in props) {
					(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name];)
				}
			}
			event.initEvent(type, bubbles, true);
			return compatible(event);
		}
	})(Zepto)

})