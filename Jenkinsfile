pipeline {
    agent any

    environment {
        ENV_FILE_PATH = "C:\\ProgramData\\Jenkins\\.jenkins\\jenkinsEnv\\qms-v2-backend"
        // ENV_FILE_PATH = "C:\\Users\\Administrator\\Desktop\\projects\\QMS_V2\\qms_api_nartec"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scmGit(
                    branches: [[name: '*/main']], 
                    extensions: [], 
                    userRemoteConfigs: [[
                        credentialsId: 'Wasim-Jenkins-Credentials', 
                        url: 'https://github.com/Wasim-Zaman/qms_api_nartec.git'
                    ]]
                )
            }
        }

        stage('Setup Environment File') {
            steps {
                echo "Copying environment file to the backend..."
                bat "copy \"${ENV_FILE_PATH}\" \"%WORKSPACE%\\.env\""
            }
        }

        stage('Manage PM2 and Install Dependencies') {
            steps {
                script {
                    echo "Stopping PM2 process if running..."
                    def processStatus = bat(script: 'pm2 list', returnStdout: true).trim()
                    if (processStatus.contains('qms') || processStatus.contains('qms-workers')) {
                        bat 'pm2 stop qms qms-workers || exit 0'
                    }
                }
                echo "Deleting node_modules folder on windows..."
                bat 'rmdir /s /q node_modules'
                echo "Deleting node_modules folder on windows... Done"
                echo "Installing dependencies for QMS..."
                bat 'npm install'
                echo "Generating Prisma files..."
                bat 'npx prisma generate --schema="./prisma/schema"'
                echo "Restarting PM2 process..."
                bat 'pm2 restart qms qms-workers'
                echo "Restarting PM2 process... Done"
                echo "Saving PM2 process..."
                bat 'pm2 save'
                echo "Saving PM2 process... Done"
            }
        }
    }
}
