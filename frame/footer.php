<?php
    global $scripts;
?>
<?php
    foreach ($scripts as $script) {
        echo "        <script src=\"{$script}\"></script>\n";
    }
?>
    </body>
</html>