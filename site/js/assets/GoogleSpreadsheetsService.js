;(function(){
	'use strict';
	angular
		.module('detilolSite')
		.value('gs', {
			cellfeedSchema:'http://schemas.google.com/spreadsheets/2006#cellsfeed',
			feedsHostname: 'spreadsheets.google.com',
			worksheetFeed: '/feeds/worksheets/',
			cellFeed: '/feeds/cells/',
			worksheetFeedSuffix: '/public/full?alt=json'
		})
		.factory('googleSpreadsheetsService', GoogleSpreadsheetsService);
	
	GoogleSpreadsheetsService.$inject = ['$http', '$log', '$q', 'gs'];
	
	function GoogleSpreadsheetsService($http, $log, $q, gs){
		var gsData = {};
	    var service = {	    		
	        getSheet:getSheet
	    };	    
	    return service;
	    
	    ///////////////////////////////////////////////////////////////
	    function getSheet(worksheet, sheet){
	    	gsData[worksheet] = gsData[worksheet] || {};
	    	if(gsData[worksheet][sheet]){
	    		return gsData[worksheet][sheet].data
	    	}else{
	    		gsData[worksheet][sheet] = {data:[['загрузка ...']]};
	    		loadSheet(worksheet, sheet);
	    		return gsData[worksheet][sheet].data;
	    	}
	    }
	    	
	    function loadSheet(worksheet, sheet){
	    	_getWorksheetPromise(worksheet)
	    		.then(_registerWorksheet)
	    		.then(function(){
	    			var jsonApiUrl = gsData[worksheet][sheet].href;
	    			$http({url:jsonApiUrl, method:'GET'})
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
	     * @return promise of feed (response.data.feed) and worksheetId: {worksheedId, feed}
	     */
	    function _getWorksheetPromise(worksheet){
	    	var url = 'http://'+gs.feedsHostname+gs.worksheetFeed+worksheet+gs.worksheetFeedSuffix;
	    	return $http({url:url, method:'GET'})
	    		.then(function(response){
	    			return {worksheetId:worksheet, feed:response.data.feed};
	    		});
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
						worksheetInfo[sheetId].href = link[k].href+'?alt=json';
						break;
					}
				}				
			}
	    	return gsData;
	    }
	    
	    function _parseCells(response){
	    	$log.debug('parsing', response);
	    	var feed = response.data.feed;
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