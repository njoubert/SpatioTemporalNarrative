NarrationView = (function() {

  function NarrationView(options) {
    this.options = options || {}; 
    this.model = options.model || undefined;
    this.modelView = options.modelView || undefined;
    this.setElement(options.el); 
    this.initialize(); 
    this._delegateEvents();
  }

  _.extend(NarrationView.prototype, Backbone.Events, {

    setElement: function(el) {
      if (!el)
        throw new Errpr("View requires a container element");
      this.el = el instanceof $ ? el.get(0) : el;
      this.$el = el instanceof $ ? el : $(el);
    },

    initialize: function() {
      this.listenTo(this.modelView, "setup", _.bind(this.renderFromScratch, this)); 
      iPadScroller.disableDefaultScrolling();
    },

    renderFromScratch: function() {
      
      var events = this.model.get("events");
      var shortName = this.model.get("shortName");

      var ts = "<% _.each(events, function(event, index) { %>";
      ts += '<div class="main_event" data_id=<%=index%>>';
      ts += '<h1><%= event.title %></h1>';
      ts += '<% _.each(event.narrative, function(item) { %>'
      ts += '<% if (item.type == "text") { %> <p><%= item.value %></p> <% } %>';
      ts += '<% if (item.type == "img") { %> <img src="/content/<%= root + "/" + item.value %>" width=600px> <% } %>';
      ts += '<% }); %>'
      ts += '<% if (event.events) { _.each(event.events, function(event) { %>';
      ts += '<h2><%= event.title %></h2>';
      ts += '<% _.each(event.narrative, function(item) { %>'
      ts += '<% if (item.type == "text") { %> <%= item.value %> <% } %>';
      ts += '<% if (item.type == "img") { %> <img src="/content/<%= root + "/" + item.value %>" width=400px> <% } %>';
      ts += '<% }); %>'
      ts += '<% }); } %>';
      ts += '</div>';
      ts += '<% }); %>';

      this.$el.html(_.template(ts, {events: events, root:shortName}));

      iPadScroller.createScroller(document, this.$el.get(0), makeScrollDelegate(this.$el.get(0), this.modelView));

      return this;
    }, 
    
    clear: function() {

      return this;
    },

    _delegateEvents: function() {

      var self = this;

    },

  });


  //**************************************************
  // Here we have the scroll delegate 
  //**************************************************
  
  function makeScrollDelegate(container_el, modelView) {


    var effects = (function() {
      var result = [];


      var amountVisible = screen.width;
      //debug("Amount visible: ", amountVisible);

      var children_els = container_el.children;
      for (var i = 0; i < children_els.length; i++) {

        var child = $(children_els[i]);

        var startOnPage = child.offset().top;
        var outerHeight = child.outerHeight();
        var innerHeight = child.height();

        //debug("Start on page:", startOnPage, ", height:", outerHeight);

        //start fading in when it becomes visible
        var start = startOnPage - amountVisible*3/4;
        // sustain when it is fully visible
        var sustain = startOnPage;
        // decay when it's halfway out
        var decay = startOnPage + innerHeight/2;
        // done when it's all the way out
        var done = startOnPage + outerHeight*3/4;

        result.push({
          progression: [start, sustain, decay, done],
          el: children_els[i]
        });
        //debug(result[result.length-1].progression)
      }
      
      return result;
    })();


    // var effects = [
    //   { progression: [200,800,1000,1650],
    //     el:        document.getElementById("img1")
    //   }
    // ];

    return function(currentTop) {

      for (var i = 0; i < effects.length; i++) {
        var p = effects[i].progression;

        if (currentTop < p[0]) {

          effects[i].el.style.opacity = 0;

        } else if (currentTop > p[0] && currentTop < p[p.length-1]) {

          //How far along are we?
          var j = 1;
          for (; j < p.length; j++) {
            if (currentTop < p[j])
              break;
          }
          j -= 1;

          if (j == 0) {        //Fading in:
            var amt = (currentTop - p[0]) / (p[1] - p[0]);
            effects[i].el.style.opacity = amt;
            effects[i].on = false;

          } else if (j == 1) {  //Sustaining
            if (!effects[i].on) {
              effects[i].on = true;
              modelView.scrollHasReached(effects[i].el.getAttribute("data_id"));
            }
            effects[i].el.style.opacity = amt;

          } else if (j == 2) {  //decaying
            effects[i].on = false;
            var amt = (p[3] - currentTop) / (p[3] - p[2]);
            effects[i].el.style.opacity = amt;
          }

        
        } else {

          effects[i].el.style.opacity = 0;
        
        }
      }

      return currentTop;
    }

  }

  return NarrationView;



})();

