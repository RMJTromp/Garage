<?php

    namespace RMJTromp\utilities;

    use RuntimeException;

    class File {

        private string $path;

        /**
         * Create file with unique file name
         * @param string $directory
         * <p>The directory where the temporary filename will be created.</p>
         * @param string $prefix
         * <p>The prefix of the generated temporary filename.</p>
         * Windows use only the first three characters of prefix.
         * @return File|false the new temporary filename, or false on
         * failure.
         */
        public static function createTempFile(string $directory, string $prefix) : File|false {
            if($directory == null || empty($directory)) $directory = sys_get_temp_dir();
            if($prefix == null) $prefix = "";
            $path = tempnam($directory, $prefix);
            return $path === false ? false : new File($path);
        }

        /**
         * Creates a new File instance by converting the given pathname string into an canonical pathname.
         * @param resource|string $file The path of resource which the file is situated at
         * @throws RuntimeException for null pointer exceptions or if it's unable to detect the path of resource
         */
        public function __construct(mixed $file) {
            if($file != null) {
                if(is_resource($file)) {
                    $metadata = stream_get_meta_data($file);
                    $uri = $metadata['uri'] ?? null;
                    if($uri != null) $this->path = $uri;
                    else throw new RuntimeException("Could not grab file URI from resource");
                } else if(is_string($file)) {
                    if(empty($file)) throw new RuntimeException("File path can not be empty");
                    $this->path = $file;
                } else throw new RuntimeException("Unsupported file parameter type");
            } else throw new RuntimeException("File can not be null");
        }

        /**
         * Attempts to create the directory specified by pathname.
         * @link https://php.net/manual/en/function.mkdir.php
         * @param int $permissions [optional]
         * <p>The mode is 0777 by default, which means the widest possible
         * access. For more information on modes, read the details
         * on the chmod page.</p>
         * <p>mode is ignored on Windows.</p>
         * <p>Note that you probably want to specify the mode as an octal number,
         * which means it should have a leading zero. The mode is also modified
         * by the current umask, which you can change using
         * umask().</p>
         * @param bool $recursive [optional]
         * <p>Allows the creation of nested directories specified in the pathname. Default to false.</p>
         * @param resource $context [optional]
         * @return bool true on success or false on failure.
         */
        public function mkdir(int $permissions = 0777, bool $recursive = false, $context = null) : bool {
            return mkdir($this->path, $permissions, $recursive, $context);
        }

        /**
         * Tells whether the filename is a directory
         * @link https://php.net/manual/en/function.is-dir.php
         * @return bool true if the filename exists and is a directory, false
         * otherwise.
         */
        public function isDirectory() : bool {
            return is_dir($this->path);
        }

        /**
         * Tells whether the filename is a regular file
         * @link https://php.net/manual/en/function.is-file.php
         * @return bool true if the filename exists and is a regular file, false
         * otherwise.
         */
        public function isFile() : bool {
            return is_file($this->path);
        }

        /**
         * Checks whether a file or directory exists
         * @link https://php.net/manual/en/function.file-exists.php
         * @return bool true if the file or directory specified by
         * filename exists; false otherwise.</p>
         * <p>This function will return false for symlinks pointing to non-existing
         * files.</p>
         * <p>This function returns false for files inaccessible due to safe mode restrictions. However these
         * files still can be included if
         * they are located in safe_mode_include_dir.</p>
         * <p>The check is done using the real UID/GID instead of the effective one.
         */
        public function exists() : bool {
            return file_exists($this->path);
        }

        /**
         * Reads entire file into a string
         * @link https://php.net/manual/en/function.file-get-contents.php
         * @param bool $use_include_path [optional]
         * <p>Note: As of PHP 5 the FILE_USE_INCLUDE_PATH constant can be
         * used to trigger include path search.</p>
         * @param resource $context [optional]
         * <p>A valid context resource created with
         * stream_context_create. If you don't need to use a
         * custom context, you can skip this parameter by null.</p>
         * @param int $offset [optional]
         * <p>The offset where the reading starts.</p>
         * @param int|null $length [optional]
         * <p>Maximum length of data read. The default is to read until end
         * of file is reached.</p>
         * @return string|false The function returns the read data or false on failure.
         */
        public function getContents(bool $use_include_path = false, $context = null, int $offset = 0, ?int $length = null) : string|false {
            if($this->isFile() && $this->exists()) return file_get_contents($this->path, $use_include_path, $context, $offset, $length);
            return false;
        }

        /**
         * Write a string to a file
         * @link https://php.net/manual/en/function.file-put-contents.php
         * @param mixed $data
         * <p>The data to write. Can be either a string, an
         * array or a stream resource.</p>
         * <p>If data is a stream resource, the
         * remaining buffer of that stream will be copied to the specified file.
         * This is similar with using stream_copy_to_stream.</p>
         * <p>You can also specify the data parameter as a single
         * dimension array. This is equivalent to
         * file_put_contents($filename, implode('', $array)).</p>
         * @param int $flags [optional]
         * <p>The value of flags can be any combination of
         * the following flags (with some restrictions), joined with the binary OR
         * (|) operator.</p>
         * <p>
         *      <table>
         *          Available flags
         *          <tr valign="top">
         *              <td>Flag</td>
         *              <td>Description</td>
         *          </tr>
         *          <tr valign="top">
         *              <td>FILE_USE_INCLUDE_PATH</td>
         *              <td>
         *                  Search for filename in the include directory.
         *                  See include_path for more
         *                  information.
         *              </td>
         *          </tr>
         *          <tr valign="top">
         *              <td>FILE_APPEND</td>
         *              <td>
         *                  If file filename already exists, append
         *                  the data to the file instead of overwriting it. Mutually
         *                  exclusive with LOCK_EX since appends are atomic and thus there
         *                  is no reason to lock.
         *              </td>
         *          </tr>
         *          <tr valign="top">
         *              <td>LOCK_EX</td>
         *              <td>
         *                  Acquire an exclusive lock on the file while proceeding to the
         *                  writing. Mutually exclusive with FILE_APPEND.
         *              </td>
         *          </tr>
         *      </table>
         * </p>
         * @param resource $context [optional]
         * <p>A valid context resource created with
         * stream_context_create.</p>
         * @return int|false The function returns the number of bytes that were written to the file, or
         * false on failure.
         */
        public function setContents(mixed $data, int $flags = 0, $context = null) : false|int {
            return file_put_contents($this->path, $data, $flags, $context);
        }

        /**
         * Get the file path which is currently being used when any method is called
         * @return string The file path
         */
        public function getPath() : string {
            return $this->path;
        }

        /**
         * Deletes a file
         * @link https://php.net/manual/en/function.unlink.php
         * @param resource $context [optional]
         * @return bool true on success or false on failure.
         */
        public function delete($context) : bool {
            return unlink($this->path, $context);
        }

        /**
         * Atomically creates a new, empty file named by its pathname if and only if a file with this name does not yet exist.
         * @return bool true if file exists or false if file doesnt exist
         */
        public function createNewFile() : bool {
            $file = fopen($this->path, "w");
            if($file === false) return false;
            fclose($file);
            return true;
        }

        /**
         * Returns canonicalized absolute pathname
         * @link https://php.net/manual/en/function.realpath.php
         * @return string|false the canonicalized absolute pathname on success. The resulting path
         * will have no symbolic link, '/./' or '/../' components.
         * <p>realpath returns false on failure, e.g. if
         * the file does not exist.</p>
         */
        public function getCanonicalPath() : string|false {
            return realpath($this->path);
        }

        /**
         * Renames a file or directory
         * @link https://php.net/manual/en/function.rename.php
         * <p>The old name. The wrapper used in oldname
         * must match the wrapper used in
         * newname.</p>
         * @param string $to
         * <p>The new name.</p>
         * @param resource $context [optional]
         * @return bool true on success or false on failure.
         */
        public function renameTo(string $to, $context) : bool {
            return rename($this->path, $to, $context);
        }

        /**
         * Copies file
         * @link https://php.net/manual/en/function.copy.php
         * @param string $to
         * <p>The destination path. If dest is a URL, the
         * copy operation may fail if the wrapper does not support overwriting of
         * existing files.</p>
         * <p>If the destination file already exists, it will be overwritten.</p>
         * @param resource $context [optional]
         * <p>A valid context resource created with
         * stream_context_create.</p>
         * @return bool true on success or false on failure.
         */
        public function copyTo(string $to, $context) : bool {
            return copy($this->path, $to, $context);
        }

        /**
         * Gets last access time of file
         * @link https://php.net/manual/en/function.fileatime.php
         * @return int|false the time the file was last accessed, or false on failure.
         * The time is returned as a Unix timestamp.
         */
        public function getLastAccessed() : false|int {
            return fileatime($this->path);
        }

        /**
         * Gets file modification time
         * @link https://php.net/manual/en/function.filemtime.php
         * @return int|false the time the file was last modified, or false on failure.
         * The time is returned as a Unix timestamp, which is
         * suitable for the date function.
         */
        public function getLastModified() : false|int {
            return filemtime($this->path);
        }

        /**
         * Gets file permissions
         * @link https://php.net/manual/en/function.fileperms.php
         * @return int|false the permissions on the file, or false on failure.
         */
        public function getFilePermissions() : false|int {
            return fileperms($this->path);
        }

        /**
         * Gets file size
         * @link https://php.net/manual/en/function.filesize.php
         * @return int|false the size of the file in bytes, or false (and generates an error
         * of level E_WARNING) in case of an error.
         */
        public function getFileSize() : false|int {
            return filesize($this->path);
        }

        /**
         * Gets file type
         * @link https://php.net/manual/en/function.filetype.php
         * @return string|false the type of the file. Possible values are fifo, char,
         * dir, block, link, file, socket and unknown.</p>
         * <p>Returns false if an error occurs. filetype will also
         * produce an E_NOTICE message if the stat call fails
         * or if the file type is unknown.
         */
        public function getFileType() : false|string {
            return filetype($this->path);
        }

        /**
         * Returns information about a file path
         * @link https://php.net/manual/en/function.pathinfo.php
         * @param int $flags [optional]
         * <p>You can specify which elements are returned with optional parameter
         * options. It composes from
         * PATHINFO_DIRNAME,
         * PATHINFO_BASENAME,
         * PATHINFO_EXTENSION and
         * PATHINFO_FILENAME. It
         * defaults to return all elements.</p>
         * @return string[]|string The following associative array elements are returned:
         * dirname, basename,
         * extension (if any), and filename.</p>
         * <p>If options is used, this function will return a
         * string if not all elements are requested.
         * @noinspection PhpSameParameterValueInspection
         */
        private function getPathInfo(int $flags = PATHINFO_ALL) : array|string {
            return pathinfo($this->path, $flags);
        }

        /**
         * Returns file extension
         * @link https://php.net/manual/en/function.pathinfo.php
         * @return string|false file extension (if applicable)
         */
        public function getExtension() : string|false {
            return $this->getPathInfo()['extension'] ?? false;
        }

        /**
         * Returns file extension
         * @link https://php.net/manual/en/function.pathinfo.php
         * @return string|false file extension (if applicable)
         */
        public function getBaseName() : string|false {
            return $this->getPathInfo()['basename'] ?? false;
        }

        /**
         * Returns file name
         * @link https://php.net/manual/en/function.pathinfo.php
         * @return string|false file name
         */
        public function getFileName() : string|false {
            return $this->getPathInfo()['filename'] ?? false;
        }

        /**
         * Returns file parent directory name
         * @link https://php.net/manual/en/function.pathinfo.php
         * @return string|false file parent directory name
         */
        public function getDirectoryName() : string|false {
            return $this->getPathInfo()['dirname'] ?? false;
        }

        /**
         * Tells whether a file or a directory exists and is readable
         * @link https://php.net/manual/en/function.is-readable.php
         * @return bool true if the file or directory specified by
         * filename exists and is readable, false otherwise.
         */
        public function canRead() : bool {
            return is_readable($this->path);
        }

        /**
         * Alias:
         * {@see is_writable}
         * @link https://php.net/manual/en/function.is-writeable.php
         * @return bool true if the filename exists and is
         * writable.
         */
        public function canWrite() : bool {
            return is_writeable($this->path);
        }

        /**
         * Tells whether the filename is executable
         * @link https://php.net/manual/en/function.is-executable.php
         * @return bool true if the filename exists and is executable, or false on
         * error.
         */
        public function canExecute() : bool {
            return is_executable($this->path);
        }

        /**
         * Changes file mode
         * @link https://php.net/manual/en/function.chmod.php
         * @param int $permissions
         * <p>Note that mode is not automatically
         * assumed to be an octal value, so strings (such as "g+w") will
         * not work properly. To ensure the expected operation,
         * you need to prefix mode with a zero (0):</p>
         * <code><pre>
         * <?php
         *      File#setFilePermissions(755);   // decimal; probably incorrect
         *      File#setFilePermissions("u+rwx,go+rx"); // string; incorrect
         *      File#setFilePermissions(0755);  // octal; correct value of mode
         * ?>
         * </pre></code>
         * <p>The mode parameter consists of three octal
         * number components specifying access restrictions for the owner,
         * the user group in which the owner is in, and to everybody else in
         * this order. One component can be computed by adding up the needed
         * permissions for that target user base. Number 1 means that you
         * grant execute rights, number 2 means that you make the file
         * writeable, number 4 means that you make the file readable. Add
         * up these numbers to specify needed rights. You can also read more
         * about modes on Unix systems with 'man 1 chmod'
         * and 'man 2 chmod'.</p>
         * @return bool true on success or false on failure.
         */
        public function setFilePermissions(int $permissions) : bool {
            return chmod($this->path, $permissions);
        }

        /**
         * Includes the script (only if php) and parses the variables etc then
         * returning the parsed string. If the file is not php, the contents will
         * be returned (equivalent of #getContents()), if the file is a directory
         * or does not exist, it will return null
         * @return string|null Parsed? content of the file
         */
        public function getParsedContent() : ?string {
            if($this->isFile() && $this->exists()) {
                if($this->getExtension() === "php") {
                    ob_start();
                    include_once $this->getPath();
                    return ob_get_clean();
                }
                return $this->getContents();
            }
            return null;
        }

        private const WRITE = 1;
        private const READ = 2;
        private const EXECUTE = 4;

        private function calculateChmodPermission(int $perms) : int {
            if($perms & self::READ) {
                if($perms & self::WRITE && $perms & self::EXECUTE) return 7;
                else if($perms & self::WRITE) return 6;
                else if($perms & self::EXECUTE) return 5;
                else return 4;
            } else {
                if($perms & self::WRITE && $perms & self::EXECUTE) return 3;
                else if($perms & self::WRITE) return 2;
                else if($perms & self::EXECUTE) return 1;
                else return 0;
            }
        }

        private function getFilePerms() : int {
            $p = 0;
            if($this->canWrite()) $p |= self::WRITE;
            if($this->canRead()) $p |= self::READ;
            if($this->canExecute()) $p |= self::EXECUTE;
            return $p;
        }

        /**
         * <b style="color:#eb3941">Warning: Untested Code</b>
         * <p>Change file permission to toggle readability</p>
         * @param bool $readable Whether the file should be readable
         * @return bool true on success and false of failure
         */
        public function setReadable(bool $readable) : bool {
            if($this->canRead() != $readable) return $this->setFilePermissions($this->calculateChmodPermission($this->getFilePerms() ^ self::READ));
            return true;
        }


        /**
         * <b style="color:#eb3941">Warning: Untested Code</b>
         * <p>Change file permission to toggle writeability</p>
         * @param bool $writeable Whether the file should be writeable
         * @return bool true on success and false of failure
         */
        public function setWriteable(bool $writeable) : bool {
            if($this->canWrite() != $writeable) return $this->setFilePermissions($this->calculateChmodPermission($this->getFilePerms() ^ self::WRITE));
            return true;
        }


        /**
         * <b style="color:#eb3941">Warning: Untested Code</b>
         * <p>Change file permission to toggle executability</p>
         * @param bool $executable Whether the file should be executable
         * @return bool true on success and false of failure
         */
        public function setExecutable(bool $executable) : bool {
            if($this->canExecute() != $executable) return $this->setFilePermissions($this->calculateChmodPermission($this->getFilePerms() ^ self::EXECUTE));
            return true;
        }

    }