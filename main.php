<?php

    require_once "RMJTromp/RMJTromp.php";
    require_once "RMJTromp/utilities/File.php";
    require_once "RMJTromp/utilities/JSON.php";

    use RMJTromp\RMJTromp;
    use RMJTromp\utilities\File;
    use RMJTromp\utilities\JSON;
    use function RMJTromp\getHeader;

    // load config file
    $config = JSON::decode(new File("config.json"), true);

    if(isset($config['database'])) {
        $host = $config['database']['host'] ?? "localhost";
        $username = $config['database']['username'] ?? "";
        $password = $config['database']['password'] ?? "";
        $database = $config['database']['database'] ?? "";
        $port = $config['database']['port'] ?? 3306;

        $conn = new mysqli($host, $username, $password, $database, $port);
        if($conn->connect_error) {
            http_response_code(500);
            exit("Error connecting to database: {$conn->connect_error}");
        }
        RMJTromp::setConnection($conn);
    } else {
        http_response_code(500);
        exit("A database is required for this website to work.");
    }

    $title = "Garage";
    $stylesheets = ["/assets/css/style.min.css"];
    $scripts = ["/assets/js/script.min.js", "/assets/js/modal.min.js", "/assets/js/EventEmitter.min.js", "/assets/js/Client.min.js"];

    $header = new File("frame/header.php");
    $footer = new File("frame/footer.php");

    // get contents of page
    $path = count(RMJTromp::getDirectoryPath()) == 0 ? ["index"] : RMJTromp::getDirectoryPath();
    $page = new File("pages/" . join("/", $path) . ".php");
    $page = $page->exists() ? $page : new File("pages/error.php");
    $body = $page->getParsedContent() ?? "";    // body needs to be parsed first in-case scripts or stylesheets are added
                                                // or the title of the page is changed

    // print out page
    $contents = $header->getParsedContent() . $body . $footer->getParsedContent();
    if(str_contains((getHeader("Accept-Encoding") ?? ""), "gzip")) {
        header("Content-Encoding: gzip");
        exit(gzencode($contents));
    } else exit($contents);