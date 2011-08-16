#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'
require 'json'
require 'haml'

set :haml, :attr_wrapper => '"', :ugly => false

class App < Sinatra::Application
  get '/' do
    @contents = {
      "4"=>'Draw a panel, deal with resizing',
      "5"=>'Draw a box',
      "6"=>'Make it draggable',
      "7"=>'Draw a palette',
      "8"=>'Drag clone from palette',
      "9"=>'Make boxes deletable',
      "10"=>'Refactor to use a model, add snapping',
      "11"=>'Add Raphael, and another div and a grid',
      "12"=>'Add outlets on boxes',
      "13"=>'Drag outlet from a box',
      "14"=>'Draw a cable to the dragged outlet',
      "15"=>'Handle dropping outlets',
      "16"=>'Cables for outlets',
      "17"=>'Proper outles and inlets',
      "18"=>'Remove inlets',
      "19"=>'Better routing for cables 1',
      "20"=>'Better routing for cables 2',
      "21"=>'Save/Load',
      "22"=>'DIY Scaling with +/- and Mousewheel',
      "23"=>'DIY Rebound scale on Load',
      "24"=>'Questions'
    }


    haml :index
  end

  
  
  get '/drag/:id' do
    @id = params[:id]
    haml :drag
  end

end

