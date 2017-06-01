pipeline {
    agent { label 'ubuntu' }
    tools {nodejs '7.2.0'}
    stages {
        stage('Example Build') {
            steps {
                echo 'Hello, Maven'
                sh 'npm --version'
            }
        }
    }
}
