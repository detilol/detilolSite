;(function(){
	'use strict';
	angular
		.module('detilolSite')
		.value('gs', {
			cellfeedSchema:'http://schemas.google.com/spreadsheets/2006#cellsfeed',
			feedsHostname: 'spreadsheets.google.com',
			worksheetFeed: '/feeds/worksheets/',
			cellFeed: '/feeds/cells/',
			worksheetFeedSuffix: '/public/full?alt=json',
			worksheetFeedUrlTemplate: 'http://spreadsheets.google.com/feeds/worksheets/:worksheetId/public/full'
		})
		.factory('googleSheetsService', GoogleSheetsService);
	
	GoogleSheetsService.$inject = ['$http', '$log', '$q', '$resource', 'gs'];
	
	function GoogleSheetsService($http, $log, $q, $resource, gs){
		var gsData = {};
		var worksheetsPromised = {};
	    var service = {	    		
	        getSheet:getSheet
	    };	    
	    return service;
	    
	    ///////////////////////////////////////////////////////////////
	    function getSheet(worksheet, sheet){
	    	if(!worksheetsPromised[worksheet]){
	    		worksheetsPromised[worksheet] = _getWorksheetPromise(worksheet);
	    	}
	    	gsData[worksheet] = gsData[worksheet] || {};
	    	if(gsData[worksheet][sheet]){
	    		return gsData[worksheet][sheet].data
	    	}else{
	    		gsData[worksheet][sheet] = {data:[['загрузка ...']]};
	    		loadSheet(worksheetsPromised[worksheet], worksheet, sheet);
	    		return gsData[worksheet][sheet].data;
	    	}
	    }
	    	
	    function loadSheet(worksheetPromise, worksheet, sheet){
	    	worksheetPromise
	    		.then(_registerWorksheet)
	    		.then(function(){
	    			var jsonApiUrl = gsData[worksheet][sheet].href;
	    			_getCellsPromise(worksheet, sheet)
	    				.then(_parseCells)
	    				.then(function(table){
	    					angular.copy(table, gsData[worksheet][sheet].data);
	    				}).
	    				catch(function(error){
	    					$log.error(error);
	    					gsData[worksheet][sheet].error = error;
	    				});
	    		});
	    }
	    
	    /**
	     * There are may be many sheets at once on a page and to avoid them
	     * simultaneously making request about worksheet's feed we register only one request
	     * in promise-registry and if exists - return the same promise for all requests. 
	     * @return promise of feed (response.data.feed) and worksheetId: {worksheedId, feed}
	     */
	    function _getWorksheetPromise(worksheet){	    	
	    	var WorksheetFeed = $resource(
	    			gs.worksheetFeedUrlTemplate,
	    			{
	    				worksheetId:worksheet,
	    				alt:'json-in-script',
	    				callback:'JSON_CALLBACK'
	    			},
	    			{
	    				getMetadata:{
	    					method:'JSONP'
	    				}
	    			}
	    	);
	    	
	    	return WorksheetFeed.getMetadata().$promise.then(function(data){
	    		return {worksheetId:worksheet, feed:data.feed};
	    	});
	    	
	    	/*
	    	var url = 'http://'+gs.feedsHostname+gs.worksheetFeed+worksheet+gs.worksheetFeedSuffix;
	    	return $http({url:url, method:'GET'})
	    		.then(function(response){
	    			return {worksheetId:worksheet, feed:response.data.feed};
	    		});
	    	*/
	    }
	    
	    function _getCellsPromise(worksheet, sheet){
	    	var jsonApiUrl = gsData[worksheet][sheet].href;
	    	var CellsFeed = $resource(
	    			jsonApiUrl,
	    			{
	    				alt:'json-in-script',
	    				callback:'JSON_CALLBACK'
	    			},
	    			{
	    				getCells:{
	    					method:'JSONP'
	    				}
	    			}
	    	);
	    	return CellsFeed.getCells().$promise;
	    }
	    /**
	     * 
	     * @param feedInfo {worksheedId, feed}
	     * @returns
	     */
	    function _registerWorksheet(feedInfo){
	    	gsData[feedInfo.worksheetId] = gsData[feedInfo.worksheetId] || {};
	    	var worksheetInfo = gsData[feedInfo.worksheetId];
	    	for(var i=0; i<feedInfo.feed.entry.length; i++){
	    		var sheet = feedInfo.feed.entry[i];
	    		var sheetId = sheet.title.$t;
	    		worksheetInfo[sheetId] = worksheetInfo[sheetId] || {};
				var link = sheet.link;				
				for(var k=0; k<link.length; k++){
					if(link[k].rel === gs.cellfeedSchema){						
						worksheetInfo[sheetId].href = link[k].href;
						break;
					}
				}				
			}
	    	return gsData;
	    }
	    
	    function _parseCells(data){
	    	var feed = data.feed;
	    	if(!feed) throw new Error('cells feed is empty');
	    	if( !feed.entry ){
	    		throw new Error('cells feed for \"'+feed.title.$t+'\": the table is empty');
	    	}
			var table = [];
			var maxColumn = 0;
			var lastRow = 0;
			for(var i=0; i<feed.entry.length; i++){
				var entry = feed.entry[i];
				var rowIndex = entry.gs$cell.row-1;				
				if(lastRow+1<rowIndex){
					for(var r=lastRow+1;r<rowIndex;r++){
						table[r] = [];
					}
				}
				if(table.length<entry.gs$cell.row){
					table[rowIndex] = [];
					lastRow = rowIndex;
				}
				
				var row = table[rowIndex];
				var currentColNum = entry.gs$cell.col;
				if(currentColNum>maxColumn) maxColumn=currentColNum;
				if(row.length<maxColumn){
					for(var k=0; k<maxColumn; k++){
						row[k] = row[k] || '';
					}
				}
				var colIndex = currentColNum-1;
				row[colIndex] = entry.gs$cell.$t;
			}
			return table;
	    }
	    	    

	};
})();