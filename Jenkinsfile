pipeline {
    agent any

    environment {
        ENV_FILE_PATH = "C:\\ProgramData\\Jenkins\\.jenkins\\jenkinsEnv\\qms-v2-backend"
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
                    if (processStatus.contains('qms')) {
                        bat 'pm2 stop qms qms-workers || exit 0'
                        bat 'pm2 delete qms || exit 0'
                        bat 'pm2 delete qms-workers || exit 0'
                    }
                }
                echo "Installing dependencies for QMS..."
                bat 'npm ci'
                echo "Generating Prisma files..."
                bat 'npx prisma generate'
                echo "Restarting PM2 process..."
                bat 'pm2 start app.js --name qms'
                bat 'pm2 start workers/index.js --name qms-workers'
                // bat 'pm2 restart qms qms-workers'
                // bat 'deploy.bat'
            }
        }
    }
}
