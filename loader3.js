/*! loader3 1.0.0
 * ©2015 Bhaskar Mangal - www.bhaskarmangal.com
 */

/**
 * @summary    loader3
 * @description Js, CSS dynamic loader
 * @version      1.0.0
 * @file            loader3.js
 * @author       Bhaskar Mangal (www.bhaskarmangal.com)
 * @copyright   Copyright 2008-2014 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   Apache License 2.0 - https://github.com/mangalbhaskar/loader3/blob/master/LICENSE
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://github.com/mangalbhaskar/loader3
 */
__loader__ns__ = typeof __loader__ns__ !== "undefined" ? __loader__ns__ : 'loader3';
//It should NOT be dependent on $ or any other js file/library/plugin
//-- Polyfills
;(function() {
  // Fix for IE7,8 does not support Object.keys
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  // http://tokenposts.blogspot.com.au/2012/04/javascript-objectkeys-browser.html
  if( !Object.keys ) Object.keys = function(o) {
    if (o !== Object(o))
       throw new TypeError('Object.keys called on a non-object');
     var k=[],p;
     for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
    return k;
  };
  
  //Reference:LABjs:https://gist.github.com/getify/603980
  //required: shim for FF <= 3.5 not having document.readyState
  if( document.readyState === null && document.addEventListener ) {
    document.readyState = "loading";
    document.addEventListener("DOMContentLoaded", handler = function () {
      document.removeEventListener("DOMContentLoaded", handler, false);
      document.readyState = "complete";
    }, false);
  }
})();
  //-- Polyfills END --//
;(function( global, document, root ) {
  root = global[root] = ( global[root]? global[root] : {} );
  if( root.loader ) {
    return root.loader;
  }
  //TBD: extend function to be coded
  var _LT =  (new Date()).getTime();
  function loaderConfig( options ) {
    return this._init( options );
  }
  loaderConfig.prototype = {
    jsMinify: false
    ,cssMinify: false
    ,ext: true
    ,path: true
    ,jsonp: false
    ,jsExt:".js"
    ,cssExt:".css"
    ,jsPath:"js/"
    ,cssPath:"css/"
    ,minify: "min/?f="
    ,_serverHostUrl: root._serverHostUrl || ''
    ,_serverHostRootUrl: root._serverHostRootUrl || ''
    ,_rStr: root._rStr || _LT
    ,_init: function( options ) {
      //TBD: extend
      options = options || {};
      //Boolean
      for( var prop in this ) {
        //should NOT use this.hasOwnProperty( prop ) condition as properties are defined on prototype
        if( typeof options[ prop ] !== "undefined" ) {
          this[ prop ] = options[ prop ];
        }
      }
      return this;
    }
  };
  
  /*utils */
  var utils = {};
  utils.closure = function( a ) {
    return function() {
      for( var i=0; i<a.length; i++ ) {
        a[ i ]();
      }
    };
  };
  utils.setOnLoadCallback = function( el, callback ) {
      utils._addEventListener(window,"load",callback)
  };
  //TBD: expose it to root for other api/js to use it
  utils._addEventListener = function( el, event, callback ) {
    if( el.addEventListener ) {
      el.addEventListener( event, callback, false );
    }else if( el.attachEvent ) {
      el.attachEvent("on"+event, callback);
    }else {
      var e = el["on"+event];
      el["on"+event] = ( null !=callback? utils.closure([callback,event]) : callback )
    }
  };
  utils.createUUID = function() {
    return"uuid-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
  };
  //Adapted from LAB.js: utils.getPage, utils.getDomain
  /*! LAB.js (LABjs :: Loading And Blocking JavaScript) v2.0.3 (c) Kyle Simpson MIT License*/
  utils.getPage = function () {
      return /^[^?#]*\//.exec(location.href)[0];
  };
  utils.getDomain = function () {
		return /^\w+\:\/\/\/?[^\/]+/.exec( utils.getPage() )[0];
  };
  utils.escapeRegExp = function( str ) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };
  utils.isArray = Array.isArray || function(obj) {
    //return toString.call(obj) == '[object Array]'; // Delegates to ECMA5's native Array.isArray
    //ECMA53 for IE7,8 support
    return obj instanceof Array; //Reference: http://stackoverflow.com/questions/14325792/when-does-object-prototype-tostring-callnull-return-object-object
  };
  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  /*each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    loader['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });*/
  utils.isObject = function( o ) {
    return o === Object( o );
  };
  utils.isUndefined = function( o ) {
    return "undefined" === typeof o;//Because undefined == null //is true, but undefined === null //is false
  };
  utils.isNull = function( o ) {
    return null === o; //Because typeof null === "object"
  };
  utils.isNumber = function( o ) {
    return "number" === typeof o;
  };
  utils.isFunction = function( o ) {
    return  "function" === typeof o;
  };
  utils.isString = function( o ) {
    return "string" === typeof o;
  };
  utils.isRegExp = function( o ) {
    return o instanceof RegExp;
  };
  utils.isDate = function( o ) {
    return o instanceof Date;
  };
  utils.anyToString = function( o ) {
    var str = '';
    if( utils.isArray( o ) ) {
      str = o.toString() ;
    }else if( utils.isObject( o ) ) {
      for(var key in o ) {
        if( o.hasOwnProperty(key) ) {
          str = str + ( key+","+o[ key ] )+",";
        }
      }
      str = str.replace(/,$/,'');
    }else {
      str = o.toString() ;
    }    
    return str;
  };
  
  var loader = {
    loadTime:_LT
    ,loaded: {}
    ,js: {}
    ,css: {}
    ,images: {}
    ,html: {}
    ,queue: []
    ,isReady:false
    ,appendTo:null
    //,apiKey:'notsupplied'
    //,keyVerified:true
    //,secure:false
  }
  ,isHeadReady = loader.isHeadReady = function() {
    if( !loader.appendTo ) {
      loader.appendTo = document.head || document.getElementsByTagName("head")[0]; //typeof document.head != "object"? document.getElementsByTagName("head")[0] : document.head;//document.getElementsByTagName('head')[0];
      if( loader.appendTo ) {
        loader.isReady = true;
      }
    }
    return loader.isReady;
  }
  ,isFileReady = loader.isFileReady = function( readyState ) {
    //Check to see if any of the ways a file can be ready are available as properties on the file's element
    return ( ! readyState || readyState == 'loaded' || readyState == 'complete' || readyState == 'uninitialized' );
  }
  ,addScriptListeners = function(node, exec) {
    if( node.addEventListener ) {
      node.addEventListener('error', exec, true);
      node.addEventListener('load', exec, true);
    }else if( node.attachEvent ) {
      node.attachEvent('onerror', exec, true);
      node.attachEvent('onload', exec, true);
      node.attachEvent('onreadystatechange', function() {
        if( node.readyState == 'complete' || node.readyState == 'loaded' ) {
          exec();
        }
      });
    }else {
      throw Error('Failed to attach listeners to script.');
    }
  }
  ,onerror = function( event, callback ) {
    //TBD:
    event = event || win.event;
    // release event listeners
    ele.onload = ele.onreadystatechange = ele.onerror = null;
    // do callback
    callback();
  }
  ,_exeCallback = function( asset, url, uuid ) {
    var count = 0;
    //console.log( "_exeCallback: url: " );console.log(url);
    /*return function() {
      var total = arguments[0].length;
      count++;
      console.log("count: ");console.log(count);
      if( count < total ) {
        jsLoad( asset, _exeCallback );
        return;
      }
      if( _callback && !_callback.done ) {
        _callback();
        _callback.done = 1;
      }
    }*/
  }
  ,cssLoad = loader.cssLoad = function() {
    var delay = arguments[0]
    ,url =  arguments[1]
    ,asset = arguments[2];
    
    //onload supported for CSS on unsupported browsers Safari windows 5.1.7, FF < 10
    setTimeout(function() {
      if( !loader.isHeadReady() ) { // `appendTo` node not yet ready
      // try again in a little bit -- note: will re-call the anonymous function in the outer setTimeout, not the parent `request_script()`
        setTimeout(arguments.callee,25);
        return;
      }
      //console.log("loader.appendTo: ");console.log( loader.appendTo );
      var node = document.createElement("link");
      node.type = 'text/css';
      node.rel = "stylesheet";
      var uuid = utils.createUUID();
      node.id = uuid;
      //node.charset = "utf-8";
      var done = 0;
      var exec = function () {
        if( !done && isFileReady( node.readyState ) ) {
          done = 1;
          //Set done to prevent this function from being called twice.
          //loader.loaded[ url ] = 1;
          loader.loaded[ url ] = uuid;
          //console.log("exec for uuid: url: "+uuid+" : "+url);
          //Handle memory leak in IE - release event listeners
          node.onload = node.onreadystatechange = node.onerror = null;
          //_exeCallback( asset ); //TBD:
          //Interestingly, if link tag node is removed it will remove the styling from dom; whereas, if script tag is removed it will not delete the javascript objects created.
          //loader.appendTo.removeChild(node);
        }
      };
      addScriptListeners( node, exec );
      node.href = url;
      //console.log("node: ");console.log( node );
      loader.appendTo.appendChild(node);
    }, delay );
  }
  ,jsLoad = loader.jsLoad = function() {
    var delay = arguments[0]
    ,url =  arguments[1]
    ,asset = arguments[2]
    ,uuid = asset.uuid;
    
    setTimeout(function() {
      //--Steps
      //0. check if isHeadReady
      //1. create node element
      //2. add node onload event listener
      //3. add node src
      //4. add node to DOM
      
      if( !loader.isHeadReady() ) { // `appendTo` node not yet ready
      // try again in a little bit -- note: will re-call the anonymous function in the outer setTimeout, not the parent `request_script()`
        setTimeout(arguments.callee,25);
        return;
      }
      //console.log("loader.appendTo: ");console.log( loader.appendTo );
      var node = document.createElement("script");
      node.type = 'text/javascript';
      //var uuid = utils.createUUID();
      node.id = uuid;
      //node.charset = "utf-8";
      node.async = false; //LAB.js use async=false for ordered async? parallel-load-serial-execute http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
      var done = 0;
      var exec = function () {
        if( !done && isFileReady( node.readyState ) ) {
          done = 1;
          //Set done to prevent this function from being called twice.
          //loader.loaded[ url ] = 1;
          //console.log(new Date());
          console.log("exec for uuid: url: "+uuid+" : "+url);
          loader.loaded[ url ] = uuid;
          //console.log("onload: ");console.log( url );
          //Handle memory leak in IE - release event listeners
          node.onload = node.onreadystatechange = node.onerror = null;
          _exeCallback( asset, url, uuid ); //TBD:
          //node.remove();
          //loader.appendTo.removeChild(node);
          //loader.appendTo.removeNode(node);
        }
      };
      addScriptListeners( node, exec );
      node.src = url;
      //console.log("node: ");console.log( node );
      loader.appendTo.appendChild(node);
    }, delay );
  }
  ,getRequire = function( config, type, require, index ) {
    //console.log("require: ");console.log( require );
    var item;
    if( utils.isArray( require ) ) {
      //console.log("require: isArray:");console.log(config);
      item = getArray.call( this, config, type, require );
    }else if( utils.isObject( require ) ) {
      //console.log("require: isObject:");
      var o = {};
      o.completed = false;
      o.loaded = false;
      o.index = index;
      o.callback = require.callback;
      //console.log( this );
      this.callback[ index ] = o;
      item = getObject.call( this, config, type, require, index );
    }else {
      //console.log("require: isString:");console.log(require);console.log(this.jsExt);console.log(this.jsPath);
      item = getString.call( this, config, type, require );
    }
    //console.log("getRequire: item: "+item);
    return item;
  }
  ,getArray = function( config, type, item ) {
    var scope = this;
    var _item = [];
    for( var j=0,len=item.length; j<len; j++ ) {
      //console.log("isArray:[j]: ["+j+"] = "+item[j]);
      if( item[ j ] ) {
          //item[ j ] = getString.call( scope, config, type, utils.anyToString( item[ j ] ) ).toString();
          _item.push( getString.call( scope, config, type, utils.anyToString( item[ j ] ) ).toString() );
      }
    }
    return _item;
  }
  ,getObject = function( config, type, item, index )  {
    //console.log( "getObject: ");console.log( config );console.log( item );
    if( item.require ) {
      return getRequire.call( this, config, type, item.require, index );//WARNING: re-currsive call
    }
  }
  ,getString = function( config, type, item ) {
    if( item ) {
      item = setPathAndExt.call( this, config, type, item );
      if( !config.jsonp ) {
        item = config[ type+'Minify' ]? item.toString() : (item.match(/,/)? item.split(/,/) : item.split(/,/)[0] );
      }
    }
    //console.log("getString: ");console.log(item);
    return item;
  }
  ,setPathAndExt = function( config, type, item ) {
    if( item.replace && typeof item.replace === "function" ) {
      type = type || 'js';
      var path = config.path? config[ type+'Path' ] : ''
      ,ext = config.ext? config[ type+'Ext' ] : '';
      //console.log("setPathAndExt: ");console.log(path);console.log(ext);
      //TBD: if .js is already present in filename
      //TBD: if instead of .js .php or anyother server side langauage is used to return javascript
      item = item.replace(/^/,path).replace(/$/,ext).replace(/,/g,ext+','+path);
      //console.log("item: ");console.log(item);
    }
    return item;
  }
  ,getAsset = function( config, type, items, callback ) {
    var asset =  {
      callback: {
        exec:callback
        ,wait:250
      }
      ,completed: false
      ,loaded: false
      ,type: type
    };
    
    var require = [];
    for( var i=0,length=items.length; i < length; i++ ) {
      //console.log("items["+i+"]: ");console.log(items[i]);
      require[ i ] = getRequire.call( asset, config, type, items[ i ], i );
      //console.log("Modified items["+i+"]: "+items[ i ]);
    }
    asset.require = require;
    if( asset.callback.exec ) {
      var count = 0;
      asset.init = function( options, scope ) {
        var _callbackTimer = function () {
          count++;
          console.log( count );
          //Must stop after 5min: 1199
          if( asset.callback.exec( options, scope ) || count > 1199 ) {
            clearInterval( asset.callback._callbackTimer );
            asset.callback.exec = undefined;
            return true;
          }
        };
        asset.callback._callbackTimer = setInterval( _callbackTimer, asset.callback.wait );
      };
    }
    return asset;
  }
  ,_createAsset = function() {
    //console.log("_setArguments: ");console.log( arguments );
    var config = arguments[0]
    ,type = arguments[1]
    ,args = arguments[2]
    ,callback = args[args.length - 1]
    ,items;

    if( typeof callback === "function" ) {
      items = [].slice.call(args, 1, args.length - 1);
    }else {
      callback = null;
      //items = [].slice.call(args);
      items = [].slice.call(args, 1, args.length);
    }
    //console.log("items: ");console.log( items );
    var asset = getAsset( config, type, items, callback );
    var uuid = utils.createUUID();
    asset.uuid = uuid;
    loader[ type ][ uuid ] = asset;
    return uuid;
  }
  ,_load = function( config, type, uuid ) {
      var asset = loader[ type ][ uuid ]; //TBD: test for asset.require exists or not or empty load
      var require = utils.isArray( asset.require[0] )? asset.require[0] : asset.require;
      //console.log("asset: ");console.log(asset);
      for( var i=0,length=require.length; i < length; i++ ) {
        var item = require[ i ], bridge = "?";
        var url = item.toString();
        if( loader.loaded[ url ] ) {
          continue;
        }
        if( !config.jsonp ) {
          if( config[ type + 'Minify' ] || url.match(/,/) ) {
            var pattern = new RegExp( utils.escapeRegExp(config.minify), 'g' );
            if( pattern.test( url )  ) {
                url = url.replace( pattern, '').replace(/^/,config.minify);
            }else {
              url = config.minify+url;
            }
          }
        }        
        if( url.match(/\?/) ) {
          bridge = "&";
        }
        var finalUrl = config._serverHostUrl+url+bridge+'r='+config._rStr;
        //console.log("finalUrl: "+finalUrl);
        loader[ type+'Load']( i, finalUrl, asset );
      }
      return asset;
  }
  ;
  
  root.load = {
    js:function() {
      var asset = false;
      if( arguments.length > 1 ) {
        var type = 'js';
        var config = new loaderConfig( arguments[0] );
        var uuid = _createAsset( config, type, arguments );
        loader.queue.push( uuid );
        asset = _load( config, type, uuid );
      }
      return asset;
    }
    ,css:function() {
      var asset = false;
      if( arguments.length > 1 ) {
        var type = 'css';
        var config = new loaderConfig( arguments[0] );
        var uuid = _createAsset( config, type, arguments );
        asset = _load( config, type, uuid );
      }
      return asset;
    }
    ,module:function( options, name, callback, params, scope ) {
      var require = ( ( root.module || {} ).require || {} )[ name ];
      var css = ( ( root.module || {} ).css || {} )[ name ];      
      //assumption: module MUST have at least ONE js component
      if( !require ) {
        return false;
      }      
      var config = new loaderConfig( options );
      //console.log("module: require: ");console.log(require);
      //console.log("module: css: ");console.log(css);      
      //load css first
      if( css ) {
        root.load.css( config, css );
      }      
      //load js next
       if( callback ) {
        root.load.js( config, require, function( params, scope ) {
          try {
            if( scope ) {
              var success = callback.call( scope, params );
            }else {
              var success = callback( params, scope );
            }
            return success;
          }catch(err) {
              console.log("ERROR in loading module..."+name);
              console.log(err.message);console.log(err.stack);
              return true;
          }
        }).init( params, scope );
      }else {
        root.load.js( require );
      }
    }
  };
  
  root._dom = function() {
    var dom = this.dom;
    document.write(dom);
    //return dom;
  };
  
  root.load.module.init = function( behaveAs, options ) {
      root._dom();
      root.load.module( {path: false,ext: false}, behaveAs, function( options, scope ) {
      //console.log('trying to load....... module_'+behaveAs);
      if( root.module.check[ behaveAs ] && root.module.check[ behaveAs ]() ) {
        root.vidteq = new root._vidteq();
        var _initMode = ( options || {} )._initMode || "widget";
        root.vidteq.init(root.aD,_initMode);
        return true;
      }
    }, options, this );
  };
  
  root.loader = loader;
  
  root.addItemInHead = function (fileName,type) {
    //console.log('inside add item in head');
    //console.log(fileName);console.log(type); 
    /* Loader helper functions */
    function isFileReady ( readyState ) {
      //Check to see if any of the ways a file can be ready are available as properties on the file's element
      return ( ! readyState || readyState == 'loaded' || readyState == 'complete' || readyState == 'uninitialized' );
    }
    
    var newElem=document.createElement(type);
    
    if ( type == 'link') {
      var bridge = '?';
      if (fileName.match(/\?/)) { bridge = '&'; }
      newElem.href=vidteq._serverHostUrl+fileName+bridge+'r='+vidteq._rStr;
      newElem.rel='stylesheet';
      newElem.type='text/css';
      var headElem=document.getElementsByTagName('head');
      headElem[0].appendChild(newElem);
    }else {
      var bridge = '?';
      
      if (typeof(fileName) == 'object') {
        // console.log('fileName is object');
        (function() {
          // Fix for IE7,8 does not support Object.keys
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
          // http://tokenposts.blogspot.com.au/2012/04/javascript-objectkeys-browser.html
          if (!Object.keys) Object.keys = function(o) {
            if (o !== Object(o))
               throw new TypeError('Object.keys called on a non-object');
             var k=[],p;
             for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
            return k;
          }
          var mother = Object.keys(fileName)[0];
          var motherScript = newElem;
         //console.log('mother');
         //console.log(mother);
          var daughters = fileName[mother];
         //console.log('daughters');
         //console.log(daughters);
          var done = false;
          if (mother.match(/\?/)) { bridge = '&'; }
          newElem.src=vidteq._serverHostUrl+mother+bridge+'r='+vidteq._rStr;
          newElem.type='text/javascript';
          var headElem=document.getElementsByTagName('head');
          //console.log(headElem);
          headElem[0].appendChild(newElem);
          newElem.onreadystatechange = newElem.onload = function () {
            //console.log('on ready executed');
            if ( ! done && isFileReady( motherScript.readyState ) ) {
              //Set done to prevent this function from being called twice.
              done = true;
              for (var i in daughters) {
                vidteq.addItemInHead(daughters[i],type);
              }
              //Handle memory leak in IE
              motherScript.onload = motherScript.onreadystatechange = null;
            }
          };
         //console.log('on ready installed');
        })();
      }else {
        if (fileName.match(/\?/)) { bridge = '&'; }
        newElem.src=vidteq._serverHostUrl+fileName+bridge+'r='+vidteq._rStr;
        newElem.type='text/javascript';
        var headElem=document.getElementsByTagName('head');
        //var headElem=document.getElementsByTagName('body');
        headElem[0].appendChild(newElem);  
      }
    }
  };
  //from LAB.js
  /* The following "hack" was suggested by Andrea Giammarchi and adapted from: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
	   NOTE: this hack only operates in FF and then only in versions where document.readyState is not present (FF < 3.6?).
	   
	   The hack essentially "patches" the **page** that LABjs is loaded onto so that it has a proper conforming document.readyState, so that if a script which does 
	   proper and safe dom-ready detection is loaded onto a page, after dom-ready has passed, it will still be able to detect this state, by inspecting the now hacked 
	   document.readyState property. The loaded script in question can then immediately trigger any queued code executions that were waiting for the DOM to be ready. 
	   For instance, jQuery 1.4+ has been patched to take advantage of document.readyState, which is enabled by this hack. But 1.3.2 and before are **not** safe or 
	   fixed by this hack, and should therefore **not** be lazy-loaded by script loader tools such as LABjs.
	*/ 
	(function(addEvent,domLoaded,handler){
		if (document.readyState == null && document[addEvent]){
			document.readyState = "loading";
			document[addEvent](domLoaded,handler = function(){
				document.removeEventListener(domLoaded,handler,false);
				document.readyState = "complete";
			},false);
		}
	})("addEventListener","DOMContentLoaded");
  //TBD: root.addItemInHead
  //return root;
}(this, document, __loader__ns__));