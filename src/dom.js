function addCss(cssText) {
    // 浏览器支持：IE < 11
    // 使用此方法最多创建 31 个styleSheet对象
    // @see: https://msdn.microsoft.com/en-us/library/ie/ms531194(v=vs.85).aspx
    if (document.createStyleSheet) {
        var styleSheet = document.createStyleSheet();
        styleSheet.cssText = cssText;
    } else {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(cssText));
        document.documentElement.firstChild.appendChild(style);
    }
}
