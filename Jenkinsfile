pipeline {
    agent { label 'ubuntu' }
    stages {
        stage('Build') {
            agent { docker 'node:6.9.1' } 
            steps {
                echo 'Hello, Node'
                sh 'npm install'
                sh 'npm run build.dev'
                echo 'Installed'
            }
        }
    }
}