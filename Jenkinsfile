pipeline {
    agent {
      label 'ubuntu'
    }
    tools {
      nodejs '6.9.5'
    }
    environment {
        NPM_TOKEN = credentials('NPM_TOKEN')
    }
    stages {
        stage ('Provide Config Files') {
            steps {
                script {
                    try {
                        configFileProvider([configFile(fileId: 'GLOBAL_NPMRC', targetLocation: '.npmrc')]) {}
                    } catch (err) {
                        echo "${err}"
                    }
                }
            }
        }
        stage('Install Packages') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build Project') {
            steps {
                sh 'npm run build.prod'
            }
        }
        stage('Publish - Master') {
            when {
                branch 'master'
            }
            steps {
                sh "npm publish --verbose"
            }
        }
        stage('Publish - Develop') {
            when {
                branch 'develop'
            }
            steps {
                echo "This is develop"
            }
        }
    }
}
