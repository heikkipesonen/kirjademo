function recommender(el,opts){
	//this._history = new history();
	this._container = $(el);

	this._container.append([
		'<div id="novel-info-container">',
				'<div id="novel-breadcrumbs" />',
				'<div id="novel-info-inner-container">',
					'<div id="novel-current-info">',
					'</div>',
					'<div id="novel-similar-list-container">',
						'<div id="novel-similar-list">',
						'</div>',
					'</div>',
				'</div>',
		'</div>'
	].join(''));
	if (!opts){
		opts = {};
	}

	this._container.find('#novel-similar-list')
	.css({
		overflow:'hidden'
	});


	this._opts = {
		similarities:opts.similarities || 10,
		item:opts.item || false // 'U4ffqtDAQZO2T3eWfnOT9Q',
	}
	var me = this;

	this._container.find('#novel-similar-list').on('click','.novel',function(){
		me.showSimilar($(this).attr('id'));
	});

	if (this._opts.item){
		this.showSimilar(this._opts.item);
	}
}

recommender.prototype = {
	empty:function(){
		this._container.find('#novel-similar-list').empty();
		this._container.find('#novel-current-info').empty();
	},
	_getData:function(data,callback){
		$.ajax({
			url:'elasticsearchproxy.php',
			dataType:'json',
			type:'POST',
			data:data,
			success:callback,
			error:function(e){
				callback(false,e)
			}
		});

	},
	_getSimilar:function(id,callback){
		var me = this;
		this._getData({
			get:'similar',
			size:this._opts.similarities,
			offset:parseInt( Math.random()* 20500 )
		},function(e,error){
			var res = [];
			if (e && e.length > 0){			
				for (var i in e){
					res.push(new novel(e[i]).setSimilarity(Math.random()));
				}			
				me._currentSet = res;
				if (callback){
					callback.call(me,res);
				}
			} else {
				console.log(error);
				console.log(error.responseText);
			}
		});
	},
	_showItems:function(items){

	},	
	_hasItem:function(id){
		for (var i in this._currentSet){
			if (this._currentSet[i].getId() == id){
				return this._currentSet[i];
			}
		}
		return false;
	},
	_getCompared:function(id){
		var me = this;
		if (this._hasItem(id)){
			this._setFullItem(this._hasItem());
		} else {
			this._getData({
				get:'id',
				id:id,
				index:'novel',
			},function(e,error){
				if (e){
					me._setFullItem(new novel(e));				
				} else {
					console.log(e);
				}
			});
		}
	},
	_setFullItem:function(novelObj){
		this._container.find('#novel-current-info').html( novelObj.getFull() );		
		var img = this._container.find('#novel-current-info').find('img');
		img.css('opacity',0);
		img.load(function(){
			$(this).css('opacity',1);
		});

		this._currentComparedTo = novelObj;
		//this._history.add(novelObj);
	},
	showSimilar:function(id,callback){
		var me = this;
		this._getSimilar(id,function(items){
			this._getCompared(id);
			
			var el = this._container.find('#novel-similar-list'),
				c = this._container.find('#novel-info-inner-container');

				items.sort(function(a,b){
					return b.getSimilarity() - a.getSimilarity();
				});

				el.empty();
				/*
				if (el.children().length > 0){
					el.packery('remove', el.children());
				}
				*/

				for (var i in items){				
					var e = items[i].getTile();
					el.append(e);//.packery('appended',e);
				}

				var counter = el.find('img').length;

				el.find('img').each(function(){
					$(this).css('opacity',0);
					$(this).load(function(){
						$(this).css('opacity',1);
						counter--;

						if (counter == 0){
							me._container.scrollTop(0);
						}
					})
				})

				if (callback){
					callback.call(this);
				}

				/*
				el.imagesLoaded(function(){
					me._container.scrollTop(0);
				});
				*/
		});
	}
}














function novel(data){
	this._properties = data;
}

novel.prototype = {
	getThumbnail:function(){
		return this.getImage();
	},
	getText:function(){
		return this._properties._source.TITLE;
	},	
	setSimilarity:function(value){
		this._properties._score = value;
		return this;
	},
	getImage:function(){
		if (this.hasImage()){
			return 'img.php?img='+this.hasImage()+'&width=200';
		} else {
			return 'icons/Grey_Book.png';
		}
	},
	getFullImage:function(){
		if (this.hasImage()){
			return 'img.php?img='+this.hasImage();
		} else {
			return 'icons/Grey_Book.png';
		}
	},
	hasImage:function(){		
		if (this._properties._source.MANIFEST_RESOURCES){
			for (var i in this._properties._source.MANIFEST_RESOURCES){
				if (this._properties._source.MANIFEST_RESOURCES[i].MANIFEST_URL!=null && this._properties._source.MANIFEST_RESOURCES[i].MANIFEST_URL!='null'){
					if (this._properties._source.MANIFEST_RESOURCES[i].MANIFEST_URL.indexOf('+') !== -1){
						return this._properties._source.MANIFEST_RESOURCES[i].MANIFEST_URL.split(' + ')[0];
					} else {
						return this._properties._source.MANIFEST_RESOURCES[i].MANIFEST_URL;
					}
				}
			}
		}
		return false;
	},	
	getId:function(){
		return this._properties._id;
	},
	getAuthor:function(){
		if (this._properties._source.AUTHOR_RESOURCES.length > 0){
			return this._properties._source.AUTHOR_RESOURCES[0];
		} else {
			return false;
		}
	},
	getShortInfo:function(){
		var s = this._properties._source;
		return '<p>'+[
			//this.getAuthor().AUTHOR_NAME,
			s.TITLE == 'null' ? '' : s.TITLE,
			//s.GENRE == 'null' ? '' : s.GENRE,
			//s.RECORD_TYPE == 'null' ? '' : s.RECORD_TYPE,
			this._properties._score
		].join('</p><p>')+'</p>';
	},	
	getFull:function(){
		var s = this._properties._source;		
		
		return $([
		'<div id="',this.getId(),'" class="novel-full-info">',
				
				'<div class="novel-information-full-front">',
					'<img src="',this.getFullImage(),'" />',
				'</div>',			

				'<div class="novel-information-full-back">',
					'<h2>',s.TITLE,'</h2>',
					'<h3>Kuvaus</h3>',
					'<p>',s.DESCRIPTION == 'null' ? '...' : s.DESCRIPTION ,'</p>',
					'<h3>Teemat</h3>',
					'<p>',s.THEMES == 'null' ? '...' : s.THEMES,'</p>',						
				'</div>',			
				/*
				'<div class="clear" />',
				*/
		'</div>'
		].join(''));

	},
	getSimilarity:function(){
		return this._properties._score;
	},
	getTile:function(){
		var relevant = '';
		if (this.getSimilarity() > 0.8){
			relevant = 'highly-recommended';
		}
		return $([
		'<div similarity="'+this.getSimilarity()+'" id="',this.getId(),'" class="novel '+relevant+'">',
			'<div class="novel-inner-container">',
				'<div class="novel-image-container" >',
					'<img src="',this.getImage(),'" />',
				'</div>',
				'<div class="novel-information">',
					this.getShortInfo(),
				'</div>',			
			'</div>',
		'</div>'
		].join(''));
	}
}



















$.fn.extend({
	recommender:function(){
		return new recommender(this);
	}
})