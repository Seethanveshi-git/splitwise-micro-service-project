pipeline {
    agent any

    environment {
        AWS_REGION = "ap-south-1"
        ECR_REGISTRY = "824033491491.dkr.ecr.ap-south-1.amazonaws.com"
    }

    stages {
        stage('Detect Changes') {
            steps {
                script {
                    // Get changes between this commit and the previous one
                    def changes = sh(script: "git diff --name-only HEAD~1 HEAD || echo 'ALL'", returnStdout: true).trim()
                    echo "Files changed: ${changes}"

                    def services = ["auth-service", "group-service", "expense-service", "dashboard-service", "api-gateway", "service-registry", "frontend"]
                    def changed = []

                    if (changes == "ALL" || changes.contains("pom.xml") || changes.contains("Jenkinsfile")) {
                        changed = services
                    } else {
                        services.each { s ->
                            if (changes.contains(s)) {
                                changed.add(s)
                            }
                        }
                    }

                    if (changed.isEmpty()) {
                        echo "No service changes detected. Building all services to be safe."
                        changed = services
                    }

                    env.SERVICES = changed.join(',')
                    echo "Services to build: ${env.SERVICES}"
                }
            }
        }

        stage('ECR Login') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-creds',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    sh """
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    """
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    def services = env.SERVICES.split(',')
                    def parallelStages = [:]

                    services.each { svc ->
                        def service = svc.trim()
                        parallelStages[service] = {
                            dir(service) {
                                echo "Building ${service}..."
                                if (service != 'frontend') {
                                    sh "mvn clean package -DskipTests"
                                }
                                sh "docker build -t ${ECR_REGISTRY}/${service}:${BUILD_NUMBER} ."
                                sh "docker push ${ECR_REGISTRY}/${service}:${BUILD_NUMBER}"
                            }
                        }
                    }
                    parallel parallelStages
                }
            }
        }

        stage('Update GitOps Repo') {
            steps {
                script {
                    def services = env.SERVICES.split(',')

                    withCredentials([string(credentialsId: 'github-token', variable: 'GIT_TOKEN')]) {

                        sh """
                        echo "===== CLONING REPO ====="
                        rm -rf manifests
                        git clone https://x-access-token:${GIT_TOKEN}@github.com/Seethanveshi-git/splitwise-k8s-manifests.git manifests
                        ls -la manifests
                        """

                        services.each { svc ->
                            def service = svc.trim()

                            sh """
                            if [ -f manifests/${service}/deployment.yaml ]; then
                                echo "Updating ${service}"
                                sed -i "s|image: .*${service}.*|image: ${ECR_REGISTRY}/${service}:${BUILD_NUMBER}|g" manifests/${service}/deployment.yaml
                            else
                                echo "Skipping ${service}, deployment.yaml not found"
                            fi
                            """
                        }

                        sh """
                        cd manifests

                        echo "===== GIT STATUS ====="
                        git status

                        git config user.email "jenkins@local"
                        git config user.name "jenkins"

                        git add .

                        echo "===== COMMIT ====="
                        git commit -m "Update images to build ${BUILD_NUMBER}" || true

                        echo "===== PUSH ====="
                        git push https://x-access-token:${GIT_TOKEN}@github.com/Seethanveshi-git/splitwise-k8s-manifests.git

                        echo "===== DONE ====="
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh "docker system prune -f || true"
        }
    }
}