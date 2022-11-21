const Meta = {
	/**
	 * Sends xhr request using the passed params
	 *
	 * @params { Object } params:
	 *  - type: type of request (GET, POST, etc.)
	 *  - url: where to send request ("/example")
	 *  - data: data to send (if needed)
	 *  - responseHandle: handle given response (using Meta.xhr.reponseJSON, etc.)
	 *  - success: callback on successful finish
	 *  - failure: callback on failing finish
	 *  - headers { Object }: any number of xhr headers to pass in ("Content-Type": "application/json", etc.)
	 */
	xhr: {
		responseJSON: (xhr) => { return JSON.parse(xhr.response) },
		responseText: (xhr) => { return xhr.responseText },

		send: function(params) {
			let xhr = new XMLHttpRequest();

			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {
					// handle error
					if (xhr.status != 200) return params.failure(xhr.response);

					params.success(params.responseHandle ? params.responseHandle(xhr) :
						Meta.xhr.responseText(xhr));
				}
			};

			xhr.onerror = params.failure;

			xhr.open(params.type, params.url, true);

			xhr.withCredentials = true;

			if (params.headers) {
				let headers = Object.keys(params.headers);
				for (let h = 0; h < headers.length; h++)
					xhr.setRequestHeader(headers[h], params.headers[headers[h]]);
			}

			xhr.send(params.data);
		}
	}
};