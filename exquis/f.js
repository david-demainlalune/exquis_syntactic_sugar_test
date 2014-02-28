var f = (function(){

	function maybe (fn) {
        return function () {
            var i;

            if (arguments.length === 0){
                return;
            }else{
                for (i = 0; i < arguments.length; ++i){
                    if (arguments[i] == null) 
                        return;
                }
                return fn.apply(this, arguments);
            }
        }
    }

    function compose(fn_a, fn_b){
        return function(x){
            fn_a(fn_b(x));
        }
    }

	return {
		maybe: maybe
	}
})();