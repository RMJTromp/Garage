<?php
    global $scripts;
?>
        <script>let exports = {};</script>
<?php
    foreach ($scripts as $script) {
        echo "        <script src=\"{$script}\"></script>\n";
    }
?>
    </body>
</html>