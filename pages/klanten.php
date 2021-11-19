<?php

$putfp = fopen('php://input', 'r');
$putdata = '';
while($data = fread($putfp, 1024))
    $putdata .= $data;
fclose($putfp);

echo $putdata;