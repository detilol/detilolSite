;(function(){
	'user strict';
	
	angular.module('detilolSite')
		.directive('googleSheet', ['googleSheetsService', function(googleSheetsService){
		var directive = {
			restrict: 'AE',
			transclude:true,
			scope:{
				worksheet:'@',
				sheet:'@'
			},			
			link:link,
			controller:function($scope){
				var vm = this;
				vm.data = googleSheetsService.getSheet($scope.worksheet, $scope.sheet);				
			},
			controllerAs:'gs'
		};
		
		return directive;
		
		function link(scope, element, attrs, controller, transclude){
			transclude(scope, function(clone, scope) {
		        element.append(clone);
		     });
		}
		
		
	}]);
})();