/*
 * L.TileLayer.Grayscale is a regular tilelayer with grayscale makeover.
 */

L.TileLayer.Grayscale = L.TileLayer.extend({
	options: {
		enabled: true,
		transformer: function (red, green, blue) {
			return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
		}
	},

	initialize: function (url, options) {
		this._useCssFilter = this._checkCssFilterSupport();

		if (this._useCssFilter) {
			this._makeGrayscale = this._makeGrayscaleCss;
			this._removeGrayscale = this._removeGrayscaleCss;
		} else {
			this._makeGrayscale = this._makeGrayscaleCanvas;
			this._removeGrayscale = this._removeGrayscaleCanvas;
			options = options || {};
			options.crossOrigin = true;
		}

		L.TileLayer.prototype.initialize.call(this, url, options);

		this.on('tileload', function (e) {
			if (this.options.enabled) {
				this._makeGrayscale(e.tile);
			}
		});
	},

	enableGrayscale: function () {
		if (this.options.enabled) {
			return;
		}

		this.options.enabled = true;

		for (var key in this._tiles) {
			this._makeGrayscale(this._tiles[key].el);
		}
	},

	disableGrayscale: function () {
		if (!this.options.enabled) {
			return;
		}

		this.options.enabled = false;

		for (var key in this._tiles) {
			this._removeGrayscale(this._tiles[key].el);
		}
	},

	_createTile: function () {
		var tile = L.TileLayer.prototype._createTile.call(this);

		if (!this._useCssFilter) {
			tile.crossOrigin = 'Anonymous';
			tile.setAttribute('data-src', tile.getAttribute('src'));
		}

		return tile;
	},

	_makeGrayscale: function () {},

	_removeGrayscale: function () {},

	_makeGrayscaleCss: function (img) {
		img.style.filter = 'grayscale(100%)';
	},

	_removeGrayscaleCss: function (img) {
		img.style.filter = '';
	},

	_makeGrayscaleCanvas: function (img) {
		if (img.getAttribute('data-grayscaled')) {
			return;
		}

		img.crossOrigin = '';
		var canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var pix = imgd.data;

		for (var i = 0, n = pix.length; i < n; i += 4) {
			pix[i] = pix[i + 1] = pix[i + 2] = this.options.transformer(pix[i], pix[i + 1], pix[i + 2]);
		}

		ctx.putImageData(imgd, 0, 0);
		img.setAttribute('data-grayscaled', true);
		img.src = canvas.toDataURL();
	},

	_removeGrayscaleCanvas: function (img) {
		img.setAttribute('src', img.getAttribute('data-src'));
		img.removeAttribute('data-grayscaled');
	},

	_checkCssFilterSupport: function () {
		try {
			return (window.CSS.supports || window.supportsCSS)('filter', 'grayscale(100%)');
		} catch (error) {
			var el = document.createElement('div');
			el.style.cssText = 'filter:grayscale(100%);';
			return !!el.style.length && ((document.documentMode === undefined || document.documentMode > 9));
		}
	}
});

L.tileLayer.grayscale = function (url, options) {
	return new L.TileLayer.Grayscale(url, options);
};
