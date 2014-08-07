(function(doc, undefined) {
    var reSelector = /^(?:(?:[#\[\]'"=.\w-])|\s+)+$/, // selector合法性检查正则，是以下4种简单表达式及其组合。此正则只检测非法selector，不保证selector一定合法
        reClass = /^\.[\w-]+$/, // .className形式的selector
        reTagName = /^\w+$/, // tagName形式的selector
        reTagNameClass = /^(\w+)\.([\w-]+)$/, // tagName.className形式的selector
        reAttr = /^(\w+)?\[([\w-]+)(?:=['"]?([\w-]+)['"]?)?\]$/; // 属性相等，支持4种形式: tagName[attr=val] [attr=val] tagName[attr] [attr]。不支持^= ~= $=等判断。

    function Select(elems) {
        this.elems = elems;
        this.length = elems.length;
    }

    // 当没有选中任何元素时，返回一个对象而非null，此对象的所有方法均可调用
    var empty = new Select([]);

    /**
     * 获取第 i 个位置的DOM元素
     * @param int i 位置，从0开始计数
     * @return object DOM对象 或 undefined
     */
    Select.prototype.get = function(i) {
        return this.elems[i];
    };

    /**
     * 遍历选中的所有元素
     * @param Function callback(domElement, index) ，参数：
     *     this 是一个Select包裹对象，domElement是
     *     domElement 是DOM对象
     *     index 是从0开始的序号
     */
    Select.prototype.each = function(callback) {
        for (var i = 0; i < this.length; i++) {
            callback.call(new Select(this.elems[i]), this.elems[i], i);
        }
    };

    /**
     * 获取第一个元素的属性
     * @param string attrName 属性名，不支持class className for 等特殊属性
     * @return string 属性值 或者 undefined
     */
    Select.prototype.attr = function(attrName) {
        return this.length ? this.elems[0].getAttribute(attrName) : undefined;
    };

    /**
     * 获取第一个元素data属性的值
     * @param string name data- 后面的值
     * @return string 属性值 或者 undefined
     */
    Select.prototype.data = function(name) {
        if (!this.length) {
            return undefined;
        }
        var elem = this.elems[0];
        return elem.dataset ? elem.dataset[name] : elem.getAttribute('data-' + name);
    };

    /**
     * 同 jQuery 的 closest：从元素本身开始，逐级向上级元素匹配，并返回最先匹配的元素。
     * @param string simpleSelector 只支持我们需要的 4 种简单选择器哦！
     * @return Select包裹对象，包含0或者1个DOM对象
     */
    Select.prototype.closest = function(simpleSelector) {
        if (!this.length) {
            return empty;
        }

        var elem = this.elems[0],
            cur = elem,
            match,
            documentElement = doc.documentElement;

        while (cur !== documentElement) {
            // #id
            if (simpleSelector.substr(0, 1) === '#') {
                if ('#' + cur.id === simpleSelector) {
                    break;
                }
            // tagName
            } else if (reTagName.test(simpleSelector)) {
                if (cur.tagName === simpleSelector) {
                    break;
                }
            // .className
            } else if (reClass.test(simpleSelector)) {
                var re = new RegExp('\\s+' + simpleSelector.substr(1) + '\\s+');
                if (re.test(' ' + cur.className + ' ')) {
                    break;
                }
            // tagName.className
            } else if (match = simpleSelector.match(reTagNameClass)) {
                var re = new RegExp('\\s+' + match[2] + '\\s+');
                if (cur.tagName === match[1] && re.test(' ' + cur.className + ' ')) {
                    break;
                }
            } else if (match = simpleSelector.match(reAttr)) {
                if ((!match[1] || cur.tagName === match[1])
                    && cur.hasAttribute(match[2])
                    && (!match[3] || cur.getAttribute(match[2]) === match[3])) {
                    break;
                }
            } else {
                throw Error('Invalid simple selector: ' + simpleSelector);
            }

            cur = cur.parentNode;
        }

        if (cur === documentElement) {
            return empty;
        }

        return new Select([cur]);
    };

    /**
     * 执行选择的函数
     * @param string selector 简单或复合选择器
     * @return Select包裹对象，包含0或者多个DOM对象
     */
    function select(selector) {
        if (!reSelector.test(selector)) {
            throw Error('Invalid selector: ' + selector);
        }

        var simpleSelectors = selector.replace(/^\s+|\s+$/g, '').split(/\s+/),
            context = null,
            result = null,
            match;

        for (var i = simpleSelectors.length - 1, simpleSelector, children; i >= 0; i--) {
            simpleSelector = simpleSelectors[i];
            // #id
            if (simpleSelector.substr(0, 1) === '#') {
                context = doc.getElementById(simpleSelector.substr(1));
            // tagName
            } else if (reTagName.test(simpleSelector)) {
                context = doc.getElementsByTagName(simpleSelector);
            // .className
            } else if (reClass.test(simpleSelector)) {
                context = getElementsByClassName(simpleSelector.substr(1));
            // tagName.className
            } else if (match = simpleSelector.match(reTagNameClass)) {
                context = getElementsByTagNameClassName(match[1], match[2]);
            } else if (match = simpleSelector.match(reAttr)) {
                getElementsByAttr(match[1], match[2], match[3]);
            } else {
                throw Error('Invalid simple selector: ' + simpleSelector);
            }

            // 返回null
            if (!hasElement(context)) {
                return empty;
            }

            if (result === null) {
                result = context;
            } else {
                result = filter(context, result);
                // 没有元素
                if (!hasElement(result)) {
                    return empty;
                }
            }
        }
        return new Select(result.length ? result : [result]);
    }

    /**
     * 是否有元素
     * @return boolean 如果有元素则返回 true ，否则返回 false
     */
    function hasElement(v) {
        return typeof v === 'object' && v !== null && (!/^\d+$/.test(v.length) || v.length > 0);
    }

    /**
     * 从右向左筛选
     * @param object|array context 左侧(祖先)刷选 DOM 集合
     * @param object|array children 当前结果的 DOM 集合
     */
    function filter(context, children) {
        context = context.length ? context : [context];
        children = children.length ? children : [children];

        var ret = [];
        for (var i = 0, iLen = context.length; i < iLen; i++) {
            for (var j = 0, jLen = children.length; j < jLen; j++) {
                if (context[i].contains(children[j])) {
                    ret.push(children[j]);
                }
            }
        }
        return ret;
    }

    /**
     * 根据className选择DOM元素集合
     * @param string className 类名
     * @return object DOM元素集合
     */
    function getElementsByClassName(className) {
        return doc.getElementsByClassName ? doc.getElementsByClassName(className) : getElementsByTagNameClassName('*', className);
    }

    /**
     * 根据 tagName.className 选择DOM元素集合
     * @param string tagName 标签名
     * @param string className 类名
     * @return object DOM元素集合
     */
    function getElementsByTagNameClassName(tagName, className) {
        var elems = doc.getElementsByTagName(tagName),
            ret = [],
            re = new RegExp('\\s+' + className + '\\s+');
        for (var i = 0, len = elems.length, elem; i < len; i++) {
            elem = elems[i];
            if (re.test(' ' + elem.className + ' ')) {
                ret.push(elem);
            }
        }
        return ret;
    }

    /**
     * 根据含有属性或属性相等，选择DOM元素集合
     * @param string|undefined tagName 标签名
     * @param string attrName 属性名
     * @param string|undefined attrValue 属性值
     * @return object DOM元素集合
     */
    function getElementsByAttr(tagName, attrName, attrValue) {
        var elems = document.getElementsByTagName(tagName || '*'),
            ret = [];
        for (var i = 0, len = elems.length, elem; i < len; i++) {
            elem = elems[i];
            if ((!tagName || elem.tagName === tagName)
                && elem.hasAttribute(attrName)
                && (!attrValue || elem.getAttribute(attrName) === attrValue)) {
                ret.push();
            }
        }

        return ret;
    }

    // exports
    window.querySelector = select;
})(document, undefined);

