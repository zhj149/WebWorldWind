/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
define([
    '../../../util/Color',
    '../KmlElements',
    './KmlGeometry',
    './KmlLinearRing',
    '../styles/KmlStyle',
    '../../../geom/Location',
    '../util/NodeTransformers',
    '../../../shapes/Polygon',
    '../../../shapes/ShapeAttributes'
], function (Color,
             KmlElements,
             KmlGeometry,
             KmlLinearRing,
             KmlStyle,
             Location,
             NodeTransformers,
             Polygon,
             ShapeAttributes) {
    "use strict";
    /**
     * Constructs an KmlPolygon. Application usually don't call this constructor. It is called by {@link KmlFile} as
     * Objects from KmlFile are read. It is concrete implementation.
     * It is Polygon and KmlGeometry.
     * @alias KmlPolygon
     * @constructor
     * @classdesc Contains the data associated with Kml polygon
     * @param options {Object}
     * @param options.objectNode {Node} Node representing Polygon
     * @param options.style {Promise} Promise of styles to be applied to this Polygon.
     * @throws {ArgumentError} If either the node is null or undefined.
     * @see https://developers.google.com/kml/documentation/kmlreference#polygon
     */
    var KmlPolygon = function (options) {
        KmlGeometry.call(this, options);

        this.initialized = false;
    };

    KmlPolygon.prototype = Object.create(KmlGeometry.prototype);

    Object.defineProperties(KmlPolygon.prototype, {
        /**
         * In case that the polygon is above ground, this property decides whether there is going to be a line to
         * the ground.
         * @memberof KmlPolygon.prototype
         * @type {Boolean}
         * @readonly
         */
        kmlExtrude: {
            get: function () {
                return this._factory.specific(this, {name: 'extrude', transformer: NodeTransformers.boolean});
            }
        },

        /**
         * Whether tessellation should be used for current node.
         * @memberof KmlPolygon.prototype
         * @readonly
         * @type {Boolean}
         */
        kmlTessellate: {
            get: function () {
                return this._factory.specific(this, {name: 'tessellate', transformer: NodeTransformers.boolean});
            }
        },

        /**
         * It explains how we should treat the altitude of the polygon. Possible choices are explained in:
         * https://developers.google.com/kml/documentation/kmlreference#point
         * @memberof KmlPolygon.prototype
         * @type {String}
         * @readonly
         */
        kmlAltitudeMode: {
            get: function () {
                return this._factory.specific(this, {name: 'altitudeMode', transformer: NodeTransformers.string});
            }
        },

        /**
         * Outer boundary of this polygon represented as a LinearRing.
         * @memberof KmlPolygon.prototype
         * @type {KmlLinearRing}
         * @readonly
         */
        kmlOuterBoundary: {
            get: function () {
                return this._factory.specific(this, {name: 'outerBoundaryIs', transformer: NodeTransformers.linearRing});
            }
        },

        /**
         * Inner boundary of this polygon represented as a LinearRing. Optional property
         * @memberof KmlPolygon.prototype.
         * @type {KmlLinearRing}
         * @readonly
         */
        kmlInnerBoundary: {
            get: function () {
                return this._factory.specific(this, {name: 'innerBoundaryIs', transformer: NodeTransformers.linearRing});
            }
        },

        /**
         * It returns center of outer boundaries of the polygon.
         * @memberof KmlPolygon.prototype
         * @readonly
         * @type {Position}
         */
        kmlCenter: {
            get: function () {
                return this.kmlOuterBoundary.kmlCenter;
            }
        }
    });

    /**
     * Internal use only. Once create the instance of actual polygon.
     * @param styles {Object|null}
     * @param styles.normal {KmlStyle} Style to apply when not highlighted
     * @param styles.highlight {KmlStyle} Style to apply when item is highlighted. Currently ignored.
     */
    KmlPolygon.prototype.createPolygon = function(dc, styles) {
        if(!this._renderable) {
            this._renderable = new Polygon(this.prepareLocations(), this.prepareAttributes(styles.normal));
            this.moveValidProperties();
            dc.currentLayer.addRenderable(this._renderable);
        }
    };

	/**
     * @inheritDoc
     */
    KmlPolygon.prototype.render = function(dc) {
        KmlGeometry.prototype.render.call(this, dc);

        if(dc.kmlOptions.lastStyle) {
            this.createPolygon(dc, dc.kmlOptions.lastStyle);
        }
    };

    // For internal use only. Intentionally left undocumented.
    KmlPolygon.prototype.moveValidProperties = function () {
        this._renderable.extrude = this.kmlExtrude || true;
        this._renderable.altitudeMode = this.kmlAltitudeMode || WorldWind.CLAMP_TO_GROUND;
    };

    /**
     * @inheritDoc
     */
    KmlPolygon.prototype.prepareAttributes = function (style) {
        var shapeOptions = style && style.generate() || {};

        shapeOptions._drawVerticals = this.kmlExtrude || false;
        shapeOptions._applyLighting = true;
        shapeOptions._depthTest = true;
        shapeOptions._outlineStippleFactor = 0;
        shapeOptions._outlineStipplePattern = 61680;
        shapeOptions._enableLighting = true;

        return new ShapeAttributes(KmlStyle.shapeAttributes(shapeOptions));
    };

    /**
     * @inheritDoc
     */
    KmlPolygon.prototype.prepareLocations = function () {
        var locations = [];
        if (this.kmlInnerBoundary != null) {
            locations[0] = this.kmlInnerBoundary.kmlPositions;
            locations[1] = this.kmlOuterBoundary.kmlPositions;
        } else {
            locations = this.kmlOuterBoundary.kmlPositions;
        }
        return locations;
    };

    /**
     * @inheritDoc
     */
    KmlPolygon.prototype.getStyle = function () {
        return this._style;
    };

    /**
     * @inheritDoc
     */
    KmlPolygon.prototype.getTagNames = function () {
        return ['Polygon'];
    };

    KmlElements.addKey(KmlPolygon.prototype.getTagNames()[0], KmlPolygon);

    return KmlPolygon;
});