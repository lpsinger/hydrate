let { dirname, join } = require('path')
let rm = require('rimraf')
let cp = require('cpr')
let glob = require('glob')

let mockSource    = join(__dirname, 'mock')
let mockTmp       = join(__dirname, 'tmp')
let pythonShared  = join('vendor', 'shared')
let rubyShared    = join('vendor', 'shared')
let nodeShared    = join('node_modules', '@architect', 'shared')
let pythonViews   = join('vendor', 'views')
let rubyViews     = join('vendor', 'views')
let nodeViews     = join('node_modules', '@architect', 'views')

// Manual list of mock app resources. If you change the mock app, update these!
let arcHttp = [
  'get-index',
  'get-memories',
  'post-up-tents',
  'put-on_your_boots',
  'delete-badness_in_life'
].map(route => join('src', 'http', route))

let arcEvents = [ 'just-being-in-nature' ]
  .map(route => join('src', 'events', route))

let arcQueues = [ 'parks-to-visit' ]
  .map(route => join('src', 'queues', route))

let arcScheduled = [ 'hikes-with-friends' ]
  .map(route => join('src', 'scheduled', route))

let arcTables = [ 'trails' ]
  .map(route => join('src', 'tables', route))

let arcStreams = [ 'rivers' ]
  .map(route => join('src', 'streams', route))

let arcCustomPath = [ 'in-the-clouds' ]
  .map(route => join('src', 'head', route))

/**
 * Functions by runtime
 */
let pythonFunctions = [ join('src', 'http', 'get-memories') ]
let rubyFunctions = [ join('src', 'http', 'delete-badness_in_life') ]
let nodeFunctions = arcHttp.concat(arcEvents, arcQueues, arcScheduled, arcTables, arcStreams)
  .filter(p => !pythonFunctions.includes(p) && !rubyFunctions.includes(p))

/**
 * Runtime dependencies
 */
let pythonDependencies = pythonFunctions
  .map(p => join(p, 'vendor', 'minimal-0.1.0.dist-info'))

let rubyDependencies = () => rubyFunctions
  .map(p => glob.sync(`${p}/vendor/bundle/ruby/**/gems/a-0.2.1`)[0])

let nodeDependencies = nodeFunctions
  .map(p => join(p, 'node_modules', 'tiny-json-http'))

/**
 * Runtime shared/views dependencies
 */
let pythonSharedDependencies = pythonFunctions
  .map(p => join(p, pythonShared, 'node_modules', 'tiny-json-http'))

let pythonViewsDependencies = pythonFunctions
  .map(p => join(p, pythonViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

let rubySharedDependencies = rubyFunctions
  .map(p => join(p, rubyShared, 'node_modules', 'tiny-json-http'))

let rubyViewsDependencies = rubyFunctions
  .map(p => join(p, rubyViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

let nodeSharedDependencies = nodeFunctions
  .map(p => join(p, nodeShared, 'node_modules', 'tiny-json-http'))

let nodeViewsDependencies = nodeFunctions
  .map(p => join(p, nodeViews, 'node_modules', 'tiny-json-http'))
  .filter(p => p.includes('get-') || p.includes('any-'))

/**
 * Artifact paths
 */
let arcFileArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonShared, '.arc')))
  .concat(rubyFunctions.map(p => join(p, rubyShared, '.arc')))
  .concat(nodeFunctions.map(p => join(p, nodeShared, '.arc')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, '.arc')))

let staticArtifacts = arcFileArtifacts
  .map(p => join(dirname(p), 'static.json'))

let sharedArtifacts = []
  .concat(pythonFunctions.map(p => join(p, rubyShared, 'shared.md')))
  .concat(rubyFunctions.map(p => join(p, rubyShared, 'shared.md')))
  .concat(nodeFunctions.map(p => join(p, nodeShared, 'shared.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'shared.md')))

let sharedArtifactsDisabled = [
  join('src', 'http', 'any-time_is_good-catchall', nodeShared, 'shared.md')
]

// Represents src/views without @views pragma (i.e. all GET fns receive views)
let getViewsArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => join(p, nodeViews, 'views.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'views.md')))
  .filter(p => p.includes('get-') || p.includes('any-'))

// Represents @views pragma
let viewsArtifacts = []
  .concat(pythonFunctions.map(p => join(p, pythonViews, 'views.md')))
  .concat(rubyFunctions.map(p => join(p, rubyViews, 'views.md')))
  .concat(nodeFunctions.map(p => join(p, nodeViews, 'views.md')))
  .concat(arcCustomPath.map(p => join(p, nodeShared, 'views.md')))

let viewsArtifactsDisabled = [
  join('src', 'http', 'any-time_is_good-catchall', nodeShared, 'views.md')
]


// Test resetters
function reset (t, callback) {
  process.chdir(__dirname)
  rm(mockTmp, { glob: false, maxBusyTries: 30 }, function (err) {
    if (err) t.fail(err)
    else {
      cp(mockSource, mockTmp, { overwrite: true }, function (err) {
        if (err) t.fail(err)
        else {
          process.chdir(mockTmp)
          callback()
        }
      })
    }
  })
}
function resetAndCopy (t, callback) {
  reset(t, function () {
    cp('_optional', 'src', { overwrite: true }, function done (err) {
      if (err) t.fail(err)
      else callback()
    })
  })
}

module.exports = {
  reset,
  resetAndCopy,

  arcHttp,
  arcEvents,
  arcQueues,
  arcScheduled,
  arcTables,
  arcStreams,

  pythonFunctions,
  rubyFunctions,
  nodeFunctions,

  pythonDependencies,
  rubyDependencies,
  nodeDependencies,

  pythonSharedDependencies,
  pythonViewsDependencies,
  rubySharedDependencies,
  rubyViewsDependencies,
  nodeSharedDependencies,
  nodeViewsDependencies,

  arcFileArtifacts,
  staticArtifacts,
  sharedArtifacts,
  sharedArtifactsDisabled,
  getViewsArtifacts,
  viewsArtifacts,
  viewsArtifactsDisabled,

  mockTmp,
}