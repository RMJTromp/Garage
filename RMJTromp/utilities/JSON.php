<?php

    namespace RMJTromp\utilities;

    class JSON {

        private function __construct() {}

        /**
         * (PHP 5 &gt;= 5.2.0, PECL json &gt;= 1.2.0)<br/>
         * Decodes a JSON string
         * @link https://php.net/manual/en/function.json-decode.php
         * @param string|File $json <p>
         * The <i>json</i> string or file being decoded.
         * </p>
         * <p>
         * This function only works with UTF-8 encoded strings.
         * </p>
         * <p>PHP implements a superset of
         * JSON - it will also encode and decode scalar types and <b>NULL</b>. The JSON standard
         * only supports these values when they are nested inside an array or an object.
         * </p>
         * @param bool|null $associative [optional] <p>
         * When <b>TRUE</b>, returned objects will be converted into
         * associative arrays.
         * </p>
         * @param int $depth [optional] <p>
         * User specified recursion depth.
         * </p>
         * @param int $flags [optional] <p>
         * Bitmask of JSON decode options:<br/>
         * {@see JSON_BIGINT_AS_STRING} decodes large integers as their original string value.<br/>
         * {@see JSON_INVALID_UTF8_IGNORE} ignores invalid UTF-8 characters,<br/>
         * {@see JSON_INVALID_UTF8_SUBSTITUTE} converts invalid UTF-8 characters to \0xfffd,<br/>
         * {@see JSON_OBJECT_AS_ARRAY} decodes JSON objects as PHP array, since 7.2.0 used by default if $assoc parameter is null,<br/>
         * {@see JSON_THROW_ON_ERROR} when passed this flag, the error behaviour of these functions is changed. The global error state is left untouched, and if an error occurs that would otherwise set it, these functions instead throw a JsonException<br/>
         * </p>
         * @return mixed the value encoded in <i>json</i> in appropriate
         * PHP type. Values true, false and
         * null (case-insensitive) are returned as <b>TRUE</b>, <b>FALSE</b>
         * and <b>NULL</b> respectively. <b>NULL</b> is returned if the
         * <i>json</i> cannot be decoded or if the encoded
         * data is deeper than the recursion limit.
         */
        public static function decode(string|File $json, ?bool $associative = false, int $depth = 512, int $flags = 0) : mixed {
            return json_decode($json instanceof File ? ($json->getContents() ?? "{}") : $json, $associative, $depth, $flags);
        }

        /**
         * (PHP 5 &gt;= 5.2.0, PECL json &gt;= 1.2.0)<br/>
         * Returns the JSON representation of a value
         * @link https://php.net/manual/en/function.json-encode.php
         * @param mixed $value <p>
         * The <i>value</i> being encoded. Can be any type except
         * a resource.
         * </p>
         * <p>
         * All string data must be UTF-8 encoded.
         * </p>
         * <p>PHP implements a superset of
         * JSON - it will also encode and decode scalar types and <b>NULL</b>. The JSON standard
         * only supports these values when they are nested inside an array or an object.
         * </p>
         * @param int $flags [optional] <p>
         * Bitmask consisting of <b>JSON_HEX_QUOT</b>,
         * <b>JSON_HEX_TAG</b>,
         * <b>JSON_HEX_AMP</b>,
         * <b>JSON_HEX_APOS</b>,
         * <b>JSON_NUMERIC_CHECK</b>,
         * <b>JSON_PRETTY_PRINT</b>,
         * <b>JSON_UNESCAPED_SLASHES</b>,
         * <b>JSON_FORCE_OBJECT</b>,
         * <b>JSON_UNESCAPED_UNICODE</b>.
         * <b>JSON_THROW_ON_ERROR</b> The behaviour of these
         * constants is described on
         * the JSON constants page.
         * </p>
         * @param int $depth [optional] <p>
         * Set the maximum depth. Must be greater than zero.
         * </p>
         * @return string|false a JSON encoded string on success or <b>FALSE</b> on failure.
         */
        public static function encode(mixed $value, int $flags = 0, int $depth = 512) : string|false {
            return json_encode($value, $flags, $depth);
        }

    }