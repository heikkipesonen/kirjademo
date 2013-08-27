<?php
	error_reporting(0);
	if (isset($_POST['get'])){
		if ($_POST['get']){		
			if ($_POST['get'] == 'manifests'){
				response( getManifests($_POST['size'],$_POST['offset']) );
			} else if ($_POST['get']=='novelinformation'){
				response( getNovelInfo($_POST['manifest_resource']) );
			} else if ($_POST['get']=='novelauthor'){
				response( getAuthor($_POST['author_resource']) );
			} else if ($_POST['get']=='authors'){
				response( getAuthors($_POST['size'],$_POST['offset']) );
			} else if ($_POST['get']=='novels'){
				response( getNovels($_POST['size'],$_POST['offset']) );
			} else if ($_POST['get']=='similar'){
				response( getNovels($_POST['size'],$_POST['offset']) );
			} else if ($_POST['get']=='id'){
				response( getId($_POST['index'],$_POST['id']));
			} else if ($_POST['get']=='search'){
				response( search($_POST['phrase'],$_POST['index'], $_POST['size'],$_POST['offset'] ));
			}
		}
	}

	function response($data){
		echo json_encode($data);
	}


	function search($phrase,$index,$size,$offset){
		$q='{"query":{
				"query_string":{
					"query":"'.$phrase.'"
				}
			},
			"size":'.$size.',
			"from":'.$offset.'
		}';	
		$novels = query($index,$q);

		$reply = array();

		foreach ($novels as $novel) {
			$reply[] = getItemManifests($novel);
		}

		return $reply;
	}

	function getAuthors($size,$offset){
		$q='{"query":{
				"term":{
					"_type":"author"
				}
			},
			"fields":["AUTHOR_NAME","AUTHOR_RESOURCE"],					
			"size":'.$size.',
			"from":'.$offset.'
		}';

		return query('author',$q);		
	}

	function getAuthor($author_resource){
		$result = array();

		if (strpos($author_resource, " + ")!==false){
			$authors = explode(" + ", $author_resource);

			foreach ($authors as $author){
				$t = getAuthor($author);
				$result[] = $t[0];
			}

			return $result;
		} else {
			$q = '{"query":{
					"text_phrase":{
						"AUTHOR_RESOURCE":{
							"query":"+ '.$author_resource.'"
						}
					}
				}				
			}';
		
			return query('author',$q);
		}
	}

	function parseReply($data){
		$result = array();
		if ($data['hits']['hits']){		
			foreach ($data['hits']['hits'] as $h){
				$result[] = $h;
			}
		}
		return $result;
	}


	function getNovelInfo($manifest_resource){
		$q = '{"query":{
					"text_phrase":{
						"MANIFEST_RESOURCES":{
							"query":"+ '.$manifest_resource.'"
						}
					}
				}				
			}';
		return query('novel',$q);
	}

	function getManifests($size,$offset){
		$q='{"query":{
				"term":{
					"_type":"manifest"
				}
			},
			"fields":["MANIFEST_URL","MANIFEST_LABEL","MANIFEST_RESOURCE"],								
			"filter":{
				"not":{
					"term":{
						"MANIFEST_URL":"null"
					}
				}
			},
			"size":'.$size.',
			"from":'.$offset.'
			}'
			;

		 return query('manifest',$q);		 
	}

	function getManifest($manifest_resource){
		if (strpos($manifest_resource, " + ")!==false){
			$manifests = explode(" + ", $manifest_resource);
			$result = array();

			foreach ($manifests as $manifest){
				$t = getManifest($manifest);
				$result[] = $t[0];
			}
			return $result;

		} else {

			$q = '{"query":{
					"text_phrase":{
						"MANIFEST_RESOURCE":{
							"query":"+ '.$manifest_resource.'"
						}
					}
				}				
			}';
		
			return query('manifest',$q);
		}
	}

	function getNovels($size,$offset){
		$q='{"query":{
				"term":{
					"_type":"novel"
				}
			},
			"size":'.$size.',
			"from":'.$offset.'
			}';

		$result = query('novel',$q);
		$reply = array();

		foreach ($result as $t){
			$reply[] = getItemManifests($t);
		}

		return $reply;
	}


	function getItemManifests($t){
		if ($t['_source']['MANIFEST_RESOURCES']){
		 	$tmp = getManifest( $t['_source']['MANIFEST_RESOURCES'] );

		 	if (!is_array($tmp)){
		 		$tmp = array($tmp);
		 	}

		 	$t['_source']['MANIFEST_RESOURCES'] = array();

		 	foreach ($tmp as $ar){

		 		if (isset($ar['_source'])){
	 				$t['_source']['MANIFEST_RESOURCES'][] = $ar['_source'];
		 		} else {
		 			$t['_source']['MANIFEST_RESOURCES'][] = $ar;
		 		}
		 	}
		 }

		
		if ($t['_source']['AUTHOR_RESOURCES']){				
			$tmp = getAuthor( $t['_source']['AUTHOR_RESOURCES'] );					
			$t['_source']['AUTHOR_RESOURCES'] = array();
			foreach ($tmp as $ar){
				if (isset($ar['_source'])){
					$t['_source']['AUTHOR_RESOURCES'][] = $ar['_source'];
				}
			}
		}

		return $t;
	}


	function getId($index,$id){
		//$url='http://demo:kissakala@127.0.0.1:9200/kirjasampo/'.$index.'/'.$id;
		$url='http://demo:kissakala@es.ereading.metropolia.fi/kirjasampo/'.$index.'/'.$id;
		
		$ch = curl_init();

		curl_setopt($ch,CURLOPT_URL,$url);
		curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch,CURLOPT_HTTPHEADER,array('Content-Type: application/json'));
		
		$result = json_decode(curl_exec($ch),true);
		curl_close($ch);
		$result = getItemManifests($result);
		return $result;		
	}

	function query($index,$data,$parse){			
		if ($index && $index!=''){
			$index .= '/';
		}

		//s$url='http://demo:kissakala@127.0.0.1:9200/kirjasampo/'.$index.'_search';
		$url='http://demo:kissakala@es.ereading.metropolia.fi/kirjasampo/'.$index.'_search';
		
		$ch = curl_init();

		curl_setopt($ch,CURLOPT_URL,$url);
		curl_setopt($ch,CURLOPT_POST,1);
		curl_setopt($ch,CURLOPT_POSTFIELDS, $data );
		curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch,CURLOPT_HTTPHEADER,array('Content-Type: application/json'));
		$result = curl_exec($ch);
		curl_close($ch);
	
		//return $result;
		if ($parse === false || $_POST['parse']=='FALSE'){
			return json_decode($result,true);
		} else {
			return parseReply( json_decode($result,true) );
		}
	}
?>