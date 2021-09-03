// author:   Samuel Mueller 
 // version: 1.1.0 
 // license:  MIT 
 // homepage: http://github.com/samu/angular-table 
(function() {
  var ColumnConfiguration, PageSequence, PaginatedSetup, ScopeConfigWrapper, Setup, StandardSetup, Table, TableConfiguration, configurationVariableNames, paginationTemplate;

  angular.module("angular-table", []);

  ColumnConfiguration = class ColumnConfiguration {
    constructor(bodyMarkup, headerMarkup) {
      this.attribute = bodyMarkup.attribute;
      this.title = bodyMarkup.title;
      this.sortable = bodyMarkup.sortable;
      this.width = bodyMarkup.width;
      this.initialSorting = bodyMarkup.initialSorting;
      // TODO untested
      if (headerMarkup) {
        this.customContent = headerMarkup.customContent;
        this.attributes = headerMarkup.attributes;
      }
    }

    createElement() {
      var th;
      return th = angular.element(document.createElement("th"));
    }

    renderTitle(element) {
      return element.html(this.customContent || this.title);
    }

    renderAttributes(element) {
      var attribute, j, len, ref, results;
      if (this.customContent) {
        ref = this.attributes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          attribute = ref[j];
          results.push(element.attr(attribute.name, attribute.value));
        }
        return results;
      }
    }

    renderSorting(element) {
      var icon;
      if (this.sortable) {
        element.attr("ng-click", `predicate = '${this.attribute}'; descending = !descending;`);
        icon = angular.element("<i style='margin-left: 10px;'></i>");
        icon.attr("ng-class", `getSortIcon('${this.attribute}', predicate, descending)`);
        return element.append(icon);
      }
    }

    renderWidth(element) {
      return element.attr("width", this.width);
    }

    renderHtml() {
      var th;
      th = this.createElement();
      this.renderTitle(th);
      this.renderAttributes(th);
      this.renderSorting(th);
      this.renderWidth(th);
      return th;
    }

  };

  configurationVariableNames = class configurationVariableNames {
    constructor(configObjectName) {
      this.configObjectName = configObjectName;
      this.itemsPerPage = `${this.configObjectName}.itemsPerPage`;
      this.sortContext = `${this.configObjectName}.sortContext`;
      this.fillLastPage = `${this.configObjectName}.fillLastPage`;
      this.maxPages = `${this.configObjectName}.maxPages`;
      this.currentPage = `${this.configObjectName}.currentPage`;
      this.orderBy = `${this.configObjectName}.orderBy`;
      this.paginatorLabels = `${this.configObjectName}.paginatorLabels`;
    }

  };

  ScopeConfigWrapper = class ScopeConfigWrapper {
    constructor(scope, configurationVariableNames1, listName) {
      this.scope = scope;
      this.configurationVariableNames = configurationVariableNames1;
      this.listName = listName;
    }

    getList() {
      return this.scope.$eval(this.listName);
    }

    getItemsPerPage() {
      return this.scope.$eval(this.configurationVariableNames.itemsPerPage) || 10;
    }

    getCurrentPage() {
      return this.scope.$eval(this.configurationVariableNames.currentPage) || 0;
    }

    getMaxPages() {
      return this.scope.$eval(this.configurationVariableNames.maxPages) || void 0;
    }

    getSortContext() {
      return this.scope.$eval(this.configurationVariableNames.sortContext) || 'global';
    }

    setCurrentPage(currentPage) {
      return this.scope.$eval(`${this.configurationVariableNames.currentPage}=${currentPage}`);
    }

    getOrderBy() {
      return this.scope.$eval(this.configurationVariableNames.orderBy) || 'orderBy';
    }

    getPaginatorLabels() {
      var paginatorLabelsDefault;
      paginatorLabelsDefault = {
        stepBack: '‹',
        stepAhead: '›',
        jumpBack: '«',
        jumpAhead: '»',
        first: 'First',
        last: 'Last'
      };
      return this.scope.$eval(this.configurationVariableNames.paginatorLabels) || paginatorLabelsDefault;
    }

  };

  TableConfiguration = class TableConfiguration {
    constructor(tableElement, attributes1) {
      this.tableElement = tableElement;
      this.attributes = attributes1;
      this.id = this.attributes.id;
      this.config = this.attributes.atConfig;
      this.paginated = this.attributes.atPaginated != null;
      this.list = this.attributes.atList;
      this.createColumnConfigurations();
    }

    capitaliseFirstLetter(string) {
      if (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      } else {
        return "";
      }
    }

    extractWidth(classes) {
      var width;
      width = /([0-9]+px)/i.exec(classes);
      if (width) {
        return width[0];
      } else {
        return "";
      }
    }

    isSortable(classes) {
      var sortable;
      sortable = /(sortable)/i.exec(classes);
      if (sortable) {
        return true;
      } else {
        return false;
      }
    }

    getInitialSorting(td) {
      var initialSorting;
      initialSorting = td.attr("at-initial-sorting");
      if (initialSorting) {
        if (initialSorting === "asc" || initialSorting === "desc") {
          return initialSorting;
        }
        throw `Invalid value for initial-sorting: ${initialSorting}. Allowed values are 'asc' or 'desc'.`;
      }
      return void 0;
    }

    collectHeaderMarkup(table) {
      var customHeaderMarkups, j, len, ref, th, tr;
      customHeaderMarkups = {};
      tr = table.find("tr");
      ref = tr.find("th");
      for (j = 0, len = ref.length; j < len; j++) {
        th = ref[j];
        th = angular.element(th);
        customHeaderMarkups[th.attr("at-attribute")] = {
          customContent: th.html(),
          attributes: th[0].attributes
        };
      }
      return customHeaderMarkups;
    }

    collectBodyMarkup(table) {
      var attribute, bodyDefinition, initialSorting, j, len, ref, sortable, td, title, width;
      bodyDefinition = [];
      ref = table.find("td");
      for (j = 0, len = ref.length; j < len; j++) {
        td = ref[j];
        td = angular.element(td);
        attribute = td.attr("at-attribute");
        title = td.attr("at-title") || this.capitaliseFirstLetter(td.attr("at-attribute"));
        sortable = td.attr("at-sortable") !== void 0 || this.isSortable(td.attr("class"));
        width = this.extractWidth(td.attr("class"));
        initialSorting = this.getInitialSorting(td);
        bodyDefinition.push({
          attribute: attribute,
          title: title,
          sortable: sortable,
          width: width,
          initialSorting: initialSorting
        });
      }
      return bodyDefinition;
    }

    createColumnConfigurations() {
      var bodyMarkup, headerMarkup, i, j, len;
      headerMarkup = this.collectHeaderMarkup(this.tableElement);
      bodyMarkup = this.collectBodyMarkup(this.tableElement);
      this.columnConfigurations = [];
      for (j = 0, len = bodyMarkup.length; j < len; j++) {
        i = bodyMarkup[j];
        this.columnConfigurations.push(new ColumnConfiguration(i, headerMarkup[i.attribute]));
      }
    }

  };

  Setup = class Setup {
    setupTr(element, repeatString) {
      var tbody, tr;
      tbody = element.find("tbody");
      tr = tbody.find("tr");
      tr.attr("ng-repeat", repeatString);
      return tbody;
    }

  };

  StandardSetup = class StandardSetup extends Setup {
    constructor(configurationVariableNames, list1) {
      super();
      this.list = list1;
      this.repeatString = `item in ${this.list} | orderBy:predicate:descending`;
    }

    compile(element, attributes, transclude) {
      return this.setupTr(element, this.repeatString);
    }

    link() {}

  };

  PaginatedSetup = class PaginatedSetup extends Setup {
    constructor(configurationVariableNames1) {
      super();
      this.configurationVariableNames = configurationVariableNames1;
      this.repeatString = "item in sortedAndPaginatedList";
    }

    compile(element) {
      var fillerTr, j, len, tbody, td, tdString, tds;
      tbody = this.setupTr(element, this.repeatString);
      tds = element.find("td");
      tdString = "";
      for (j = 0, len = tds.length; j < len; j++) {
        td = tds[j];
        tdString += "<td><span>&nbsp;</span></td>";
      }
      // TODO
      fillerTr = angular.element(document.createElement("tr"));
      fillerTr.attr("ng-show", this.configurationVariableNames.fillLastPage);
      fillerTr.html(tdString);
      fillerTr.attr("ng-repeat", "item in fillerArray");
      tbody.append(fillerTr);
    }

    link($scope, $element, $attributes, $filter) {
      var cvn, getFillerArray, getSortedAndPaginatedList, update, w;
      cvn = this.configurationVariableNames;
      w = new ScopeConfigWrapper($scope, cvn, $attributes.atList);
      getSortedAndPaginatedList = function(list, currentPage, itemsPerPage, orderBy, sortContext, predicate, descending, $filter) {
        var fromPage, val;
        if (list) {
          val = list;
          fromPage = itemsPerPage * currentPage - list.length;
          if (sortContext === "global") {
            val = $filter(orderBy)(val, predicate, descending);
            val = $filter("limitTo")(val, fromPage);
            val = $filter("limitTo")(val, itemsPerPage);
          } else {
            val = $filter("limitTo")(val, fromPage);
            val = $filter("limitTo")(val, itemsPerPage);
            val = $filter(orderBy)(val, predicate, descending);
          }
          return val;
        } else {
          return [];
        }
      };
      getFillerArray = function(list, currentPage, numberOfPages, itemsPerPage) {
        var fillerLength, itemCountOnLastPage, j, k, ref, ref1, ref2, results, results1, x;
        itemsPerPage = parseInt(itemsPerPage);
        if (list.length <= 0) {
          results = [];
          for (x = j = 0, ref = itemsPerPage - 1; (0 <= ref ? j <= ref : j >= ref); x = 0 <= ref ? ++j : --j) {
            results.push(x);
          }
          return results;
        } else if (currentPage === numberOfPages - 1) {
          itemCountOnLastPage = list.length % itemsPerPage;
          if (itemCountOnLastPage !== 0) {
            fillerLength = itemsPerPage - itemCountOnLastPage - 1;
            results1 = [];
            for (x = k = ref1 = list.length, ref2 = list.length + fillerLength; (ref1 <= ref2 ? k <= ref2 : k >= ref2); x = ref1 <= ref2 ? ++k : --k) {
              results1.push(x);
            }
            return results1;
          } else {
            return [];
          }
        }
      };
      update = function() {
        var nop;
        $scope.sortedAndPaginatedList = getSortedAndPaginatedList(w.getList(), w.getCurrentPage(), w.getItemsPerPage(), w.getOrderBy(), w.getSortContext(), $scope.predicate, $scope.descending, $filter);
        nop = Math.ceil(w.getList().length / w.getItemsPerPage());
        return $scope.fillerArray = getFillerArray(w.getList(), w.getCurrentPage(), nop, w.getItemsPerPage());
      };
      $scope.$watch(cvn.currentPage, function() {
        return update();
      });
      $scope.$watch(cvn.itemsPerPage, function() {
        return update();
      });
      $scope.$watch(cvn.sortContext, function() {
        return update();
      });
      $scope.$watchCollection($attributes.atList, function() {
        return update();
      });
      $scope.$watch(`${$attributes.atList}.length`, function() {
        $scope.numberOfPages = Math.ceil(w.getList().length / w.getItemsPerPage());
        return update();
      });
      $scope.$watch("predicate", function() {
        return update();
      });
      return $scope.$watch("descending", function() {
        return update();
      });
    }

  };

  Table = class Table {
    constructor(element1, tableConfiguration, configurationVariableNames1) {
      this.element = element1;
      this.tableConfiguration = tableConfiguration;
      this.configurationVariableNames = configurationVariableNames1;
    }

    constructHeader() {
      var i, j, len, ref, tr;
      tr = angular.element(document.createElement("tr"));
      ref = this.tableConfiguration.columnConfigurations;
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        tr.append(i.renderHtml());
      }
      return tr;
    }

    setupHeader() {
      var header, thead, tr;
      thead = this.element.find("thead");
      if (thead) {
        header = this.constructHeader();
        tr = angular.element(thead).find("tr");
        tr.remove();
        return thead.append(header);
      }
    }

    getSetup() {
      if (this.tableConfiguration.paginated) {
        return new PaginatedSetup(this.configurationVariableNames);
      } else {
        return new StandardSetup(this.configurationVariableNames, this.tableConfiguration.list);
      }
    }

    compile() {
      this.setupHeader();
      this.setup = this.getSetup();
      return this.setup.compile(this.element);
    }

    setupInitialSorting($scope) {
      var bd, j, len, ref, results;
      ref = this.tableConfiguration.columnConfigurations;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        bd = ref[j];
        if (bd.initialSorting) {
          if (!bd.attribute) {
            throw "initial-sorting specified without attribute.";
          }
          $scope.predicate = bd.attribute;
          results.push($scope.descending = bd.initialSorting === "desc");
        } else {
          results.push(void 0);
        }
      }
      return results;
    }

    post($scope, $element, $attributes, $filter) {
      this.setupInitialSorting($scope);
      if (!$scope.getSortIcon) {
        $scope.getSortIcon = function(predicate, currentPredicate, descending) {
          if (predicate !== $scope.predicate) {
            return "glyphicon glyphicon-minus";
          }
          if (descending) {
            return "glyphicon glyphicon-chevron-down";
          } else {
            return "glyphicon glyphicon-chevron-up";
          }
        };
      }
      return this.setup.link($scope, $element, $attributes, $filter);
    }

  };

  PageSequence = class PageSequence {
    constructor(lowerBound1 = 0, upperBound1 = 1, start = 0, length1 = 1) {
      this.lowerBound = lowerBound1;
      this.upperBound = upperBound1;
      this.length = length1;
      if (this.length > (this.upperBound - this.lowerBound)) {
        throw "sequence is too long";
      }
      this.data = this.generate(start);
    }

    generate(start) {
      var j, ref, ref1, results, x;
      if (start > (this.upperBound - this.length)) {
        start = this.upperBound - this.length;
      } else if (start < this.lowerBound) {
        start = this.lowerBound;
      }
      results = [];
      for (x = j = ref = start, ref1 = parseInt(start) + parseInt(this.length) - 1; (ref <= ref1 ? j <= ref1 : j >= ref1); x = ref <= ref1 ? ++j : --j) {
        results.push(x);
      }
      return results;
    }

    resetParameters(lowerBound, upperBound, length) {
      this.lowerBound = lowerBound;
      this.upperBound = upperBound;
      this.length = length;
      if (this.length > (this.upperBound - this.lowerBound)) {
        throw "sequence is too long";
      }
      return this.data = this.generate(this.data[0]);
    }

    relocate(distance) {
      var newStart;
      newStart = this.data[0] + distance;
      return this.data = this.generate(newStart, newStart + this.length);
    }

    realignGreedy(page) {
      var newStart;
      if (page < this.data[0]) {
        newStart = page;
        return this.data = this.generate(newStart);
      } else if (page > this.data[this.length - 1]) {
        newStart = page - (this.length - 1);
        return this.data = this.generate(newStart);
      }
    }

    realignGenerous(page) {}

  };

  paginationTemplate = "<div style='margin: 0px;'> <ul class='pagination'> <li ng-class='{disabled: getCurrentPage() <= 0}'> <a href='' ng-click='stepPage(-numberOfPages)'>{{getPaginatorLabels().first}}</a> </li> <li ng-show='showSectioning()' ng-class='{disabled: getCurrentPage() <= 0}'> <a href='' ng-click='jumpBack()'>{{getPaginatorLabels().jumpBack}}</a> </li> <li ng-class='{disabled: getCurrentPage() <= 0}'> <a href='' ng-click='stepPage(-1)'>{{getPaginatorLabels().stepBack}}</a> </li> <li ng-class='{active: getCurrentPage() == page}' ng-repeat='page in pageSequence.data'> <a href='' ng-click='goToPage(page)' ng-bind='page + 1'></a> </li> <li ng-class='{disabled: getCurrentPage() >= numberOfPages - 1}'> <a href='' ng-click='stepPage(1)'>{{getPaginatorLabels().stepAhead}}</a> </li> <li ng-show='showSectioning()' ng-class='{disabled: getCurrentPage() >= numberOfPages - 1}'> <a href='' ng-click='jumpAhead()'>{{getPaginatorLabels().jumpAhead}}</a> </li> <li ng-class='{disabled: getCurrentPage() >= numberOfPages - 1}'> <a href='' ng-click='stepPage(numberOfPages)'>{{getPaginatorLabels().last}}</a> </li> </ul> </div>";

  angular.module("angular-table").directive("atTable", [
    "$filter",
    function($filter) {
      return {
        restrict: "AC",
        scope: true,
        compile: function(element,
    attributes,
    transclude) {
          var cvn,
    table,
    tc;
          tc = new TableConfiguration(element,
    attributes);
          cvn = new configurationVariableNames(attributes.atConfig);
          table = new Table(element,
    tc,
    cvn);
          table.compile();
          return {
            post: function($scope,
    $element,
    $attributes) {
              return table.post($scope,
    $element,
    $attributes,
    $filter);
            }
          };
        }
      };
    }
  ]);

  angular.module("angular-table").directive("atPagination", [
    function() {
      return {
        restrict: "E",
        scope: true,
        replace: true,
        template: paginationTemplate,
        link: function($scope,
    $element,
    $attributes) {
          var cvn,
    getNumberOfPages,
    keepInBounds,
    setNumberOfPages,
    update,
    w;
          cvn = new configurationVariableNames($attributes.atConfig);
          w = new ScopeConfigWrapper($scope,
    cvn,
    $attributes.atList);
          keepInBounds = function(val,
    min,
    max) {
            val = Math.max(min,
    val);
            return Math.min(max,
    val);
          };
          getNumberOfPages = function() {
            return $scope.numberOfPages;
          };
          setNumberOfPages = function(numberOfPages) {
            return $scope.numberOfPages = numberOfPages;
          };
          update = function(reset) {
            var newNumberOfPages,
    pagesToDisplay;
            if (w.getList()) {
              if (w.getList().length > 0) {
                newNumberOfPages = Math.ceil(w.getList().length / w.getItemsPerPage());
                setNumberOfPages(newNumberOfPages);
                if ($scope.showSectioning()) {
                  pagesToDisplay = w.getMaxPages();
                } else {
                  pagesToDisplay = newNumberOfPages;
                }
                $scope.pageSequence.resetParameters(0,
    newNumberOfPages,
    pagesToDisplay);
                // TODO warum ist die reihenfolge der folgenden beiden aufrufe irrelevant?
                w.setCurrentPage(keepInBounds(w.getCurrentPage(),
    0,
    getNumberOfPages() - 1));
                return $scope.pageSequence.realignGreedy(w.getCurrentPage());
              } else {
                setNumberOfPages(1);
                $scope.pageSequence.resetParameters(0,
    1,
    1);
                w.setCurrentPage(0);
                return $scope.pageSequence.realignGreedy(0);
              }
            }
          };
          $scope.showSectioning = function() {
            return w.getMaxPages() && getNumberOfPages() > w.getMaxPages();
          };
          $scope.getCurrentPage = function() {
            return w.getCurrentPage();
          };
          $scope.getPaginatorLabels = function() {
            return w.getPaginatorLabels();
          };
          $scope.stepPage = function(step) {
            step = parseInt(step);
            w.setCurrentPage(keepInBounds(w.getCurrentPage() + step,
    0,
    getNumberOfPages() - 1));
            return $scope.pageSequence.realignGreedy(w.getCurrentPage());
          };
          $scope.goToPage = function(page) {
            return w.setCurrentPage(page);
          };
          $scope.jumpBack = function() {
            return $scope.stepPage(-w.getMaxPages());
          };
          $scope.jumpAhead = function() {
            return $scope.stepPage(w.getMaxPages());
          };
          $scope.pageSequence = new PageSequence();
          $scope.$watch(cvn.itemsPerPage,
    function() {
            return update();
          });
          $scope.$watch(cvn.maxPages,
    function() {
            return update();
          });
          $scope.$watch($attributes.atList,
    function() {
            return update();
          });
          $scope.$watch(`${$attributes.atList}.length`,
    function() {
            return update();
          });
          return update();
        }
      };
    }
  ]);

  angular.module("angular-table").directive("atImplicit", [
    function() {
      return {
        restrict: "AC",
        compile: function(element,
    attributes,
    transclude) {
          var attribute;
          attribute = element.attr("at-attribute");
          if (!attribute) {
            throw `at-implicit specified without at-attribute: ${element.html()}`;
          }
          return element.append(`<span ng-bind='item.${attribute}'></span>`);
        }
      };
    }
  ]);

}).call(this);
