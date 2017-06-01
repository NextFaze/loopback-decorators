pipeline {
    agent { label 'ubuntu' }
    tools {nodejs '7.2.0'}
    stages {
        def settings = null
        stage('Configuration') {
            steps {
                // Read the settings file
                try {
                    echo "${env}"
                    settings = readYaml file: 'jenkins.yaml';
                } catch (err) {
                    echo "Failed to read jenkins yaml file, settings not loaded"
                }
            }
        }
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
                def willDeploy = getAutoConfig(settings)
                echo "willDeploy: ${willDeploy}"
                // sh 'npm publish'
            }
        }
    }
}

def getAutoConfig(settings) {
  def autoDeployBranches = settings.auto_deploy_configurations.keySet() as String[]
  def autoDeployConfig = null;
  // Iterate for each auto deploy branch in the configuration
  echo "Branch is ${env.BRANCH_NAME}"
  for (i = 0; i < autoDeployBranches.length; i++) {
    if (env.BRANCH_NAME.contains(autoDeployBranches[i])) {
      autoDeployConfig = settings.auto_deploy_configurations[autoDeployBranches[i]]
    }
  }
  return autoDeployConfig
}