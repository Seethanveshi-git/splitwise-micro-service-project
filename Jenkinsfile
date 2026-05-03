pipeline {
    agent any

    environment {
        AWS_REGION = "ap-south-1"
        AWS_ACCOUNT_ID = "824033491491"
        ECR_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }

    stages {

        stage('Detect Changes') {
            steps {
                script {
                    def changes = sh(
                        script: """
                        git diff --name-only ${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: 'HEAD~1'} HEAD || echo FIRST_BUILD
                        """,
                        returnStdout: true
                    ).trim()

                    def services = [
                        "service-registry",
                        "auth-service",
                        "group-service",
                        "expense-service",
                        "dashboard-service",
                        "api-gateway"
                    ]

                    def changed = []

                    if (changes.contains("FIRST_BUILD") || !env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
                        changed = services
                    } else {
                        if (changes.contains("pom.xml") || changes.contains("docker-compose.yml")) {
                            changed = services
                        } else {
                            services.each { s ->
                                if (changes.contains(s)) {
                                    changed.add(s)
                                }
                            }
                        }
                    }

                    if (changed.isEmpty()) {
                        error("No services to build")
                    }

                    env.SERVICES = changed.join(',')
                    echo "Services: ${env.SERVICES}"
                }
            }
        }

        stage('Build & Push Services') {
            steps {
                script {

                    def services = env.SERVICES.split(',')
                    def parallelStages = [:]

                    services.each { svc ->
                        def service = svc.trim()

                        parallelStages[service] = {

                            stage(service) {
                                dir(service) {

                                    withCredentials([usernamePassword(
                                        credentialsId: 'aws-creds',
                                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                                    )]) {

                                        sh """
                                        set -e

                                        export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                                        export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                                        export AWS_DEFAULT_REGION=${AWS_REGION}

                                        echo "🔐 Logging into ECR..."
                                        aws ecr get-login-password --region ${AWS_REGION} \
                                        | docker login --username AWS --password-stdin ${ECR_URL}

                                        echo "📦 Building ${service}..."
                                        mvn clean package -DskipTests

                                        docker build -t ${service}:${BUILD_NUMBER} .

                                        echo "🏷️ Tagging image..."
                                        docker tag ${service}:${BUILD_NUMBER} ${ECR_URL}/${service}:${BUILD_NUMBER}

                                        echo "🚀 Pushing to ECR..."
                                        docker push ${ECR_URL}/${service}:${BUILD_NUMBER}
                                        """
                                    }
                                }
                            }
                        }
                    }

                    parallelStages.failFast = true
                    parallel parallelStages
                }
            }
        }
    }
}