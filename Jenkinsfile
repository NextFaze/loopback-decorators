pipeline {
    agent { label 'ubuntu' }
    tools {nodejs '7.2.0'}
    stages {
        stage('Install') {
            steps {
                sh 'npm i'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build.prod'
            }
        }
        stage('Publish') {
            steps {
                // sh 'npm publish'
            }
        }
    }
}