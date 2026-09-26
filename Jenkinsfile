pipeline {
    agent any

    // Requires a NodeJS installation named exactly "NodeJS" configured under
    // Manage Jenkins > Tools (see the setup guide). This puts node/npm on the
    // PATH for every stage below, regardless of what account the Jenkins
    // service itself runs as.
    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm install'
                        } else {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh 'npm test'
                        } else {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        // Docker build/push and deployment stages get added here in Phase 6/7.
    }

    post {
        success {
            echo 'Build and tests passed.'
        }
        failure {
            echo 'Build or tests failed - check the stage logs above.'
        }
        always {
            echo 'Pipeline finished.'
        }
    }
}
