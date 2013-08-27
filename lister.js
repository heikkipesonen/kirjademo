function lister(opts){
	this._switcher = new switcher();
}

lister.prototype = {
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
	getList:function(){
		var p = this._container.find('#novel-list');
		var temp = this._container.find('#novel-temporary-container');

				this._getData({
					get:'manifests',
					size:'40',
					offset:'830'
				},function(e){
					if (e){
						for (var i in e){


							var img = '';
							if (e[i].fields.MANIFEST_URL){					
								if (e[i].fields.MANIFEST_URL.indexOf('+') !== -1){
									img = e[i].fields.MANIFEST_URL.split(' + ')[0];
								} else {
									img = e[i].fields.MANIFEST_URL;
								}
							}

							temp.append([
								'<div class="list-novel">',
									'<img src="',img,'" />',
								'</div>'
							].join(''));
						}
						
						temp.find('img').each(function(){
							$(this).load(function(){
								var e = $(this).parent();
								e.css('opacity',0);
								p.append(e);
								e.transition({
									opacity:1
								},500)
							});
						});
					}
				});
	}	
}







