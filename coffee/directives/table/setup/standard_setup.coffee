class StandardSetup extends Setup
  constructor: (configurationVariableNames, @list) ->
    super()
    @repeatString = "item in #{@list} | orderBy:predicate:descending"

  compile: (element, attributes, transclude) ->
    @setupTr(element, @repeatString)

  link: () ->
