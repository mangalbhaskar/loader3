# loader3
Javascript,CSS Asynchronous loader

#Usage
Default Path: js/ or css/
Default Extention: .js or .css

## Simple Case
loader3.load.css({} ,'jquery,style');
loader3.load.js({} ,'jquery,blah1,blah2');

## Use Loader Configuration
loader3.load.css({ext:false,path:false} ,'css/jquery.css,css/style.css');
loader3.load.js({ext:false,path:false} ,'js/jquery.js,js/blah1.js,js/blah2.js');
loader3.load.js({ext:false,path:false,_serverHostUrl:"http://www.example.com"} ,'js/jquery.js,js/blah1.js,js/blah2.js');

## Use Loader Configuration with Callback and Dependency Check
loader3.load.js(
  {}
  ,'jquery,blah1,blah2'
  ,function( options ) {
    if( JQuery ) {
      // do something
      options._callback();
      return true;
    }
  }
).init({
  _callback:function() {}
});