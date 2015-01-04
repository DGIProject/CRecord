<?php
/**
 * Created by PhpStorm.
 * User: Dylan
 * Date: 02/01/2015
 * Time: 18:50
 */


if($_POST['message'] != NULL)
{
    include_once 'BDD_connect.php';

    $req = $bdd->prepare('INSERT INTO logs (usernameId, type, action, message) VALUES (:usernameId, :type, :action, :message)');

    if($req->execute(array('usernameId' => $_SESSION['userId'], 'type' => 'ERROR', 'action' => 'STUDENT_RECORDSYSTEM', 'message' => $_POST['message'])))
    {
        echo 'true';
    }
    else
    {
        echo 'false';
    }
}
else
{
    echo 'false';
}