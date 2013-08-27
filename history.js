function history(){
	this._element = $('<ul class="history" />')
	this._items = [];		
	
	this._maxStates = 1000;

	var me = this;
	this._element.on('click','li',function(){
		me.getState(parseInt($(this).attr('list-index')));
	});

	$(window).resize(function(){
		me._updateList();
	});
}

history.prototype ={
	empty:function(){
		this._items = [];
		this._updateList();
		return this;
	},
	length:function(){
		return this._items.length;
	},
	getLatest:function(){
		return this._items[this._items.length-1];
	},
	getElement:function(){
		this._updateList();
		return this._element;
	},
	addTo:function(selector,style){
		$(selector).append(this.getElement());
		this.setStyle(style);
		return this;
	},
	setStyle:function(style){
		if (style){
			this._element.css(style);
		}
		return this;
	},
	getState:function(index){
		var item = this._items[index];
		this.onClick.call(this,this._items[index],index);
	},
	returnToState:function(index){
		this._items = this._items.slice(0,index+1);
		this._updateList();
		return this;
	},
	add:function(item){
		if (item instanceof Array){
			for (var i in item){
				this.add(item[i]);
			}
		} else {
			var found = false;
			for (var i in this._items){
				if (this._items[i].getId() == item.getId()){
					found = true;
				}
			}

			if (!found){		
				this._items.push(item);
				
				if (this._items.length > this._maxStates){
					this._items.shift();
				}

				this._updateList();
			}
		}
		return this;
	},
	getPrev:function(){
		return this._items[this._items.length-1];
	},
	getIndex:function(list_item){
		return list_item.attr('list-index');
	},
	_updateList:function(){
		this._element.empty();
		for (var i in this._items){
			this._element.append('<li list-id="'+this._items[i].getId()+'" list-index="'+i+'"><!-- <img src="'+this._items[i].getThumbnail()+'"></img> --> <p>'+this._items[i].getText()+'</p></li>')
		}

		var w = 0;
		this._element.children().each(function(){
			w += $(this).outerWidth(true);
		});

		var me =this;

		if (w > this._element.innerWidth()){				
			this._element.children().each(function(){
				if (w > me._element.innerWidth()){	
					w -= $(this).outerWidth(true);							
					$(this).remove();
				}
			});
		}
		return this;
	},
	onClick:function(){

	}
}

