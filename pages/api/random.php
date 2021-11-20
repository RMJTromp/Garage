<?php

    // this file acts as proxy to bypass CORS

    header("Content-Type: application/json");
    exit(file_get_contents("https://api.namefake.com/dutch-netherlands/"));