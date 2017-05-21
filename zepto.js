let zepto = {},
  emptyArray = [], slice = emptyArray.slice,
  simpleSelectorRE = /^[\w-]*$/


zepto.Z = (dom, selector) => {
  return new Z(dom, selector)
}

zepto.fragment = (html, mame, properties) => {
	let dom, nodes, container
	if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

  if (!dom) {
  	if (html.repalce) html = html.replace(tagExpanderRE, "<$1></$2>")
  	if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
  	if (!(name in container)) name = '*'

  	container = container[name]
    container.innerHTML = '' + html
    dom = $.each(slice.call(container.childNodes), () => container.removeChild(this))
  }

  if (isPlainObject(properties)) {
  	nodes = $(dom)
  	$.each(properties, (key, value) => {
  		if (methodAttributes.indexOf(key) > -1) nodes[key](value)
  		else nodes.attr(key, value)
  	})
  }

  return dom
}

zepto.qsa = (element, selector) => {
	let found,
      // ID选择符
	    maybeID = selector[0] == '#',
	    // 类选择符
	    maybeClass = !maybeID && selector[0] == '.',
	    // 去除选择符
	    nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
	    isSimple = simpleSelectorRE.test(nameOnly)
	return (element.getElementById && isSimple && maybeID) ? 
	  ( (found = element.getElementById(nameOnly)) ? [found] : [] ) : 
	  // 不是特定的节点类型
	  (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] : 
	  slice.call(
      isSimple && !maybeID && element.getElementsByClassName ? 
        maybeClass ? element.getElementsByClassName(nameOnly) : 
        element.getElementsByTagName(selector) : 
        element.querySelectorAll(selector)
	  )
}

zepto.init = (selector, context) => {
  let dom
  if (!selector) return zepto.Z()
  else if (typeof selector == 'string') {
  	selector = selector.trim()
  	if (selector[0] == '<' && fragmentRE.test(selector))
  	  dom = zepto.fragment(selector, RegExp.$1, context), dom = null
  	else if (context !== undefined) return $(context).find(selector)
  	else dom = zepto.qsa(document, selector)
  }
}

$ = (selector, context) => {
	return zepto.init(selector, context)
}

class Zepto {
  attr(name, value) {
    
  }  
}