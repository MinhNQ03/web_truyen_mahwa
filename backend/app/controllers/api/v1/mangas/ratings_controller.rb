module Api
  module V1
    module Mangas
      class RatingsController < Api::V1::BaseController
        before_action :authenticate_user!
        before_action :set_manga
        before_action :set_rating, only: [:update, :destroy]
  
        def create
          @rating = current_user.ratings.find_or_initialize_by(manga: @manga)
          @rating.value = rating_params[:rating]
  
          if @rating.save
            render json: {
              rating: @manga.reload.rating,
              totalVotes: @manga.total_votes
            }
          else
            render json: { errors: @rating.errors }, status: :unprocessable_entity
          end
        end
  
        def update
          if @rating.update(value: rating_params[:rating])
            render json: {
              rating: @manga.reload.rating,
              totalVotes: @manga.total_votes
            }
          else
            render json: { errors: @rating.errors }, status: :unprocessable_entity
          end
        end
  
        def destroy
          @rating.destroy
          render json: {
            rating: @manga.reload.rating,
            totalVotes: @manga.total_votes
          }
        end
  
        private
  
        def set_manga
          @manga = Manga.find(params[:manga_id])
        end
  
        def set_rating
          @rating = current_user.ratings.find_by!(manga: @manga)
        end
  
        def rating_params
          params.require(:rating).permit(:rating)
        end
      end
    end
  end
end