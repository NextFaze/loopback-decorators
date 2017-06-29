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
            }
          }
        }
        stage('Install Packages') {
          steps {
              configFileProvider([configFile(fileId: 'GLOBAL_NPMRC', targetLocation: '.npmrc')]) {
                sh 'npm install'
              }
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
              configFileProvider([configFile(fileId: 'GLOBAL_PUBLIC_NPMRC', targetLocation: '.npmrc')]) {
                sh "npm publish --verbose"
              }
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
