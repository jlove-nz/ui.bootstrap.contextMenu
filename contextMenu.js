angular.module('ui.bootstrap.contextMenu', [])

.directive('contextMenu', ["$parse", function ($parse) {

    // This code is based on the bootstrap-contextmenu.js plugin.
    // from https://github.com/sydcanem/bootstrap-contextmenu. It
    // is used so that if a user attempts to show a dropdown menu
    // near the edge of their screen, the context menu is repositioned
    // to be entirely on it, rather than having it partially off, 
    // which means they don't need to scroll to see the rest.
	var getPosition = function(e, $menu) {
        var mouseX = e.clientX
            , mouseY = e.clientY
            , boundsX = $(window).width()
            , boundsY = $(window).height()
            , menuWidth = $menu.find('.dropdown-menu').outerWidth()
            , menuHeight = $menu.find('.dropdown-menu').outerHeight()
            , tp = {}
            , Y, X, parentOffset;

        // This may not work for scrolling situations - I haven't tested
        // with all manner of layouts, only with the ones relevant to my
        // system.
        // 
        // The - 5 is to give a small buffer for padding around the
        // main dialog. Mostly for aesthetics.
        //
        // Also note that the logic assumes that the context menu will
        // work as the context menu will be displayed attached to a
        // div with relative positioning. This matches the original logic.
        if (mouseY + menuHeight > boundsY) {
            Y = {"top": -1 * (mouseY + menuHeight - boundsY) - 5 }
        } else {
            Y = {"top": 0 }
        }

        if ((mouseX + menuWidth > boundsX) && ((mouseX - menuWidth) > 0)) {
            X = {"left": -1 * (mouseX + menuWidth - boundsX) - 5 }
        } else {
            X = {"left": 0 }
        }

        // If context-menu's parent is positioned using absolute or relative positioning,
        // the calculated mouse position will be incorrect.
        // Adjust the position of the menu by its offset parent position.
        parentOffset = $menu.offsetParent().offset();
        X.left = X.left - parentOffset.left;
        Y.top = Y.top - parentOffset.top;

        return $.extend(tp, Y, X);
    }

    var renderContextMenu = function ($scope, event, options, model) {
        if (!$) { var $ = angular.element; }
        $(event.currentTarget).addClass('context');
        var $contextMenu = $('<div>');
        $contextMenu.addClass('dropdown clearfix');
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({ 'role': 'menu' });
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px'
        });
        angular.forEach(options, function (item, i) {
            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else {
                var $a = $('<a>');
                $a.attr({ tabindex: '-1', href: '#' });
                var text = typeof item[0] == 'string' ? item[0] : item[0].call($scope, $scope, event, model);
                $a.text(text);
                $li.append($a);
                var enabled = angular.isDefined(item[2]) ? item[2].call($scope, $scope, event, text, model) : true;
                if (enabled) {
                    $li.on('click', function ($event) {
                        $event.preventDefault();
                        $scope.$apply(function () {
                            $(event.currentTarget).removeClass('context');
                            $contextMenu.remove();
                            item[1].call($scope, $scope, event, model);
                        });
                    });
                } else {
                    $li.on('click', function ($event) {
                        $event.preventDefault();
                    });
                    $li.addClass('disabled');
                }
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);

        // New reposition so that if the context menu would go off the screen,
        // it is repositioned to not do so. We need to do this after adding the
        // context menu to the screen otherwise we don't have appropriate sizing
        // for the menu.
        var contextMenuCss = getPosition(event, $contextMenu);
        $contextMenu.css(contextMenuCss);

        $contextMenu.on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $(event.currentTarget).removeClass('context');
                $contextMenu.remove();
            }
        }).on('contextmenu', function (event) {
            $(event.currentTarget).removeClass('context');
            event.preventDefault();
            $contextMenu.remove();
        });
    };
    return function ($scope, element, attrs) {
        element.on('contextmenu', function (event) {
            event.stopPropagation();
            $scope.$apply(function () {
                event.preventDefault();
                var options = $scope.$eval(attrs.contextMenu);
                var model = $scope.$eval(attrs.model);
                if (options instanceof Array) {
                    if (options.length === 0) { return; }
                    renderContextMenu($scope, event, options, model);
                } else {
                    throw '"' + attrs.contextMenu + '" not an array';
                }
            });
        });
    };
}]);
